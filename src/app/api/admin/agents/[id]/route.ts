import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { id } = await ctx.params;
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        _count: { select: { uploadedSkills: true, uploadedRules: true, apiKeys: true } },
        apiKeys: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            isRevoked: true,
            rateLimit: true,
            expiresAt: true,
            lastUsedAt: true,
            createdAt: true,
          },
        },
      },
    });
    if (!agent) {
      return jsonErr("用户不存在", 404);
    }

    return jsonOk({ agent });
  } catch (e) {
    return toApiResponse(e);
  }
}
