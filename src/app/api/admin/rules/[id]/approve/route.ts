import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { notifyRuleModerationResult } from "@/lib/hub-notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { id } = await ctx.params;
    const existing = await prisma.rule.findUnique({ where: { id } });
    if (!existing) {
      return jsonErr("Rule 不存在", 404);
    }

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        moderationNote: null,
      },
      include: { category: true },
    });

    if (existing.authorAgentId) {
      try {
        await notifyRuleModerationResult(existing.authorAgentId, true, existing.name, null);
      } catch {
        /* ignore */
      }
    }

    return jsonOk({ rule }, "已通过审核");
  } catch (e) {
    return toApiResponse(e);
  }
}
