import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { apiKeyPrefix, generateApiKey, hashApiKey } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

/** 撤销该 Agent 全部 API Key 并新建 Default Key；明文仅本次返回 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { id } = await ctx.params;
    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      return jsonErr("用户不存在", 404);
    }

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = apiKeyPrefix(rawKey);

    const row = await prisma.$transaction(async (tx) => {
      await tx.apiKey.updateMany({
        where: { agentId: id, isRevoked: false },
        data: { isRevoked: true },
      });
      return tx.apiKey.create({
        data: {
          agentId: id,
          keyHash,
          keyPrefix,
          name: "Default",
          scopes: [],
          rateLimit: 100,
        },
      });
    });

    return jsonOk(
      {
        apiKey: rawKey,
        key: {
          id: row.id,
          name: row.name,
          keyPrefix: row.keyPrefix,
          createdAt: row.createdAt,
        },
      },
      "已重置：旧 Key 已全部撤销，请妥善保存新 Key",
    );
  } catch (e) {
    return toApiResponse(e);
  }
}
