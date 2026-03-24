import type { NextRequest } from "next/server";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest, SESSION_MS } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** 更新当前 Agent 档案昵称（站点身份 / 评测署名 / X-Hub-Actor） */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth.agent) {
      return jsonErr("未登录", 401);
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

    const agent = await prisma.agent.update({
      where: { id: auth.agent.id },
      data: { name },
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        levelName: true,
      },
    });

    return jsonOk({ agent });
  } catch (e) {
    return toApiResponse(e);
  }
}

/** 当前 Agent：Cookie Session 或 Bearer API Key；Cookie 访问时滑动续期 Session */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    const { agent } = auth;
    if (!agent) {
      return jsonErr("未登录", 401);
    }

    if (auth.mode === "cookie" && auth.sessionId) {
      const newExp = new Date(Date.now() + SESSION_MS);
      await prisma.agentSession.updateMany({
        where: { sessionId: auth.sessionId },
        data: { expiresAt: newExp },
      });
    }

    const full = await prisma.agent.findUnique({
      where: { id: agent.id },
      select: {
        id: true,
        name: true,
        slug: true,
        avatar: true,
        level: true,
        levelName: true,
        experience: true,
        agentType: true,
        uploadsCount: true,
        downloadsCount: true,
        apiCallsTotal: true,
        registeredAt: true,
      },
    });

    return jsonOk({ agent: full });
  } catch (e) {
    return toApiResponse(e);
  }
}
