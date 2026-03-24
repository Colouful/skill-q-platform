import type { NextRequest } from "next/server";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { apiKeyPrefix, generateApiKey, getAuthFromRequest, hashApiKey } from "@/lib/agent-auth";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
});

const GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * 轮换 Key：生成新 Key，旧 Key 在 24 小时内仍可用（通过 expiresAt 自然过期，不立即 isRevoked）。
 */
export async function POST(req: NextRequest) {
  try {
    const { agent } = await getAuthFromRequest(req);
    if (!agent) {
      return jsonErr("未登录", 401);
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return jsonErr("请求体须为 JSON", 400);
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }

    const oldRow = await prisma.apiKey.findFirst({
      where: { id: parsed.data.id, agentId: agent.id },
    });
    if (!oldRow) {
      return jsonErr("Key 不存在", 404);
    }
    if (oldRow.isRevoked) {
      return jsonErr("已撤销的 Key 无法轮换", 400);
    }

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = apiKeyPrefix(rawKey);
    const graceUntil = new Date(Date.now() + GRACE_MS);

    const result = await prisma.$transaction(async (tx) => {
      await tx.apiKey.update({
        where: { id: oldRow.id },
        data: { expiresAt: graceUntil },
      });
      const created = await tx.apiKey.create({
        data: {
          agentId: agent.id,
          keyHash,
          keyPrefix,
          name: oldRow.name,
          description: oldRow.description,
          scopes: oldRow.scopes as Prisma.InputJsonValue,
          rateLimit: oldRow.rateLimit,
        },
      });
      return { created, apiKey: rawKey, graceUntil };
    });

    return jsonOk({
      apiKey: result.apiKey,
      key: {
        id: result.created.id,
        name: result.created.name,
        keyPrefix: result.created.keyPrefix,
        createdAt: result.created.createdAt,
      },
      previousKeyExpiresAt: result.graceUntil.toISOString(),
      message: "旧 Key 在 24 小时内仍可使用，请尽快切换到新 Key",
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
