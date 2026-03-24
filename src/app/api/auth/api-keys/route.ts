import type { NextRequest } from "next/server";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import {
  apiKeyPrefix,
  generateApiKey,
  getAuthFromRequest,
  hashApiKey,
} from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** 列出当前 Agent 的 Key（仅前缀） */
export async function GET(req: NextRequest) {
  try {
    const { agent } = await getAuthFromRequest(req);
    if (!agent) {
      return jsonErr("未登录", 401);
    }

    const keys = await prisma.apiKey.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        isRevoked: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return jsonOk({ keys });
  } catch (e) {
    return toApiResponse(e);
  }
}

/** 新建 Key；明文仅在本次响应返回 */
export async function POST(req: NextRequest) {
  try {
    const { agent } = await getAuthFromRequest(req);
    if (!agent) {
      return jsonErr("未登录", 401);
    }

    let body: { name?: string } = {};
    try {
      body = (await req.json()) as { name?: string };
    } catch {
      body = {};
    }

    const name = (body.name ?? "Extra").trim().slice(0, 50) || "Extra";
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = apiKeyPrefix(rawKey);

    const row = await prisma.apiKey.create({
      data: {
        agentId: agent.id,
        keyHash,
        keyPrefix,
        name,
        scopes: [],
        rateLimit: 100,
      },
    });

    return jsonOk({
      apiKey: rawKey,
      key: {
        id: row.id,
        name: row.name,
        keyPrefix: row.keyPrefix,
        createdAt: row.createdAt,
      },
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
