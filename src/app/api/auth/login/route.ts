import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import {
  SESSION_COOKIE,
  SESSION_MS,
  classifyApiKeyForLogin,
  generateSessionId,
} from "@/lib/agent-auth";
import { applyExperienceDelta, XP_DAILY_LOGIN } from "@/lib/agent-experience";
import { rateLimitResponseHeaders } from "@/lib/api-rate-limit";
import { checkLoginRateLimit } from "@/lib/login-rate-limit";
import { trackFailedLoginAttempt } from "@/lib/login-fail-track";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** 网页登录：POST { apiKey }，写 HttpOnly Cookie */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = await checkLoginRateLimit(ip);
    if (!rl.ok) {
      return jsonErr(`登录尝试过于频繁，请 ${rl.retryAfterSec} 秒后再试`, 429, 1, {
        headers: rateLimitResponseHeaders(rl),
      });
    }

    let body: { apiKey?: string } = {};
    try {
      body = (await req.json()) as { apiKey?: string };
    } catch {
      return jsonErr("请求体须为 JSON", 400);
    }

    const raw = body.apiKey?.trim();
    if (!raw) {
      return jsonErr("请提供 apiKey", 400);
    }

    const hit = await classifyApiKeyForLogin(raw);
    if (!hit.ok) {
      void trackFailedLoginAttempt(ip);
      if (hit.reason === "revoked") {
        return jsonErr("API Key 已撤销", 403);
      }
      if (hit.reason === "expired") {
        return jsonErr("API Key 已过期", 401);
      }
      if (hit.reason === "inactive_agent" || hit.reason === "blocked") {
        return jsonErr("账户已禁用，无法登录", 403);
      }
      return jsonErr("无效的 API Key", 401);
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_MS);

    await prisma.agentSession.create({
      data: {
        sessionId,
        agentId: hit.agent.id,
        apiKeyId: hit.apiKey.id,
        userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
        ipAddress: clientIp(req).slice(0, 50),
        expiresAt,
      },
    });

    await prisma.apiKey.update({
      where: { id: hit.apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    let agentLevelUp: { level: number; levelName: string } | null = null;
    await prisma.$transaction(async (tx) => {
      const row = await tx.agent.findUnique({
        where: { id: hit.agent.id },
        select: { metadata: true },
      });
      const meta = (row?.metadata as Record<string, unknown> | null) ?? {};
      const today = new Date().toISOString().slice(0, 10);
      if (meta.lastDailyXpAt === today) {
        await tx.agent.update({
          where: { id: hit.agent.id },
          data: { lastActiveAt: new Date() },
        });
        return;
      }
      const xp = await applyExperienceDelta(tx, hit.agent.id, XP_DAILY_LOGIN);
      if (xp?.leveledUp) {
        agentLevelUp = { level: xp.level, levelName: xp.levelName };
      }
      await tx.agent.update({
        where: { id: hit.agent.id },
        data: {
          lastActiveAt: new Date(),
          metadata: { ...meta, lastDailyXpAt: today } as object,
        },
      });
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(SESSION_MS / 1000),
      path: "/",
    });

    const fresh = await prisma.agent.findUnique({
      where: { id: hit.agent.id },
      select: { id: true, slug: true, name: true, level: true, levelName: true },
    });

    return jsonOk(
      {
        agent: fresh ?? {
          id: hit.agent.id,
          slug: hit.agent.slug,
          name: hit.agent.name,
          level: hit.agent.level,
          levelName: hit.agent.levelName,
        },
        agentLevelUp,
      },
      undefined,
      { headers: rateLimitResponseHeaders(rl) },
    );
  } catch (e) {
    return toApiResponse(e);
  }
}
