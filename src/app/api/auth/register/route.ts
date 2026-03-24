import type { NextRequest } from "next/server";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import {
  apiKeyPrefix,
  generateApiKey,
  getDefaultAvatar,
  hashApiKey,
  identifyAgentType,
} from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { rateLimitResponseHeaders } from "@/lib/api-rate-limit";
import { checkRegisterRateLimit } from "@/lib/register-rate-limit";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

/** Agent 可直接 GET 查看注册说明（正式注册须 POST JSON） */
export async function GET() {
  return jsonOk({
    message: "使用 POST JSON 注册；人类请通过 /me 复制注册链接给 Agent",
    method: "POST",
    path: "/api/auth/register",
    body: { name: "string" },
    contentType: "application/json",
  });
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Agent 注册：POST JSON { name } */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = await checkRegisterRateLimit(ip);
    if (!rl.ok) {
      return jsonErr(`注册过于频繁，请 ${rl.retryAfterSec} 秒后再试`, 429, 1, {
        headers: rateLimitResponseHeaders(rl),
      });
    }

    let body: { name?: string } = {};
    try {
      body = (await req.json()) as { name?: string };
    } catch {
      return jsonErr("请求体须为 JSON", 400);
    }

    const name = (body.name ?? "").trim().slice(0, 100);
    if (!name) {
      return jsonErr("缺少 name", 400);
    }

    const ua = req.headers.get("user-agent") ?? "";
    const agentType = identifyAgentType(ua);
    const slug = `agent-${Date.now().toString(36)}-${randomBytes(5).toString("hex")}`;

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = apiKeyPrefix(rawKey);

    const agent = await prisma.agent.create({
      data: {
        name,
        slug,
        avatar: getDefaultAvatar(),
        agentType,
        metadata: {
          userAgent: ua,
          ip,
          registeredVia: "api/auth/register",
        } as object,
        apiKeys: {
          create: {
            keyHash,
            keyPrefix,
            name: "Default",
            scopes: [],
            rateLimit: 100,
          },
        },
      },
    });

    return jsonOk({
      apiKey: rawKey,
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        level: agent.level,
        levelName: agent.levelName,
        agentType: agent.agentType,
      },
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
