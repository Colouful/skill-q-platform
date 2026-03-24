import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { notifySkillModerationResult } from "@/lib/hub-notifications";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  note: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { id } = await ctx.params;
    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) {
      return jsonErr("Skill 不存在", 404);
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }

    const note = parsed.data.note?.trim() || null;
    const skill = await prisma.skill.update({
      where: { id },
      data: {
        moderationStatus: MODERATION_STATUS.REJECTED,
        moderationNote: note,
      },
      include: { category: true },
    });

    if (existing.authorAgentId) {
      try {
        await notifySkillModerationResult(existing.authorAgentId, false, existing.name, note);
      } catch {
        /* ignore */
      }
    }

    return jsonOk({ skill }, "已拒绝");
  } catch (e) {
    return toApiResponse(e);
  }
}
