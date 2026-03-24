import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { assertHubAuthForReviewAuthor } from "@/lib/hub-auth";
import { syncRuleReviewStats, syncSkillReviewStats } from "@/lib/skill-review-stats";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchBody = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    content: z.string().min(1).optional(),
    author: z.string().min(1).max(100).optional(),
  })
  .refine((o) => o.rating !== undefined || o.content !== undefined || o.author !== undefined, {
    message: "至少提供一项要修改的字段",
  });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true, skillId: true, ruleId: true, author: true },
    });
    if (!existing) {
      return jsonErr("评测不存在", 404);
    }

    assertHubAuthForReviewAuthor(req, existing.author);

    const raw = await req.json();
    const parsed = patchBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    const data: { rating?: number; content?: string; author?: string } = {};
    if (b.rating !== undefined) data.rating = b.rating;
    if (b.content !== undefined) data.content = b.content.trim();
    if (b.author !== undefined) data.author = b.author.trim();

    const review = await prisma.review.update({
      where: { id },
      data,
    });

    if (b.rating !== undefined) {
      if (existing.skillId) await syncSkillReviewStats(existing.skillId);
      if (existing.ruleId) await syncRuleReviewStats(existing.ruleId);
    }

    return jsonOk(review, "已更新");
  } catch (e) {
    return toApiResponse(e);
  }
}
