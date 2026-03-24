import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/agent-auth";
import { applyExperienceDelta, XP_FIVE_STAR_REVIEW } from "@/lib/agent-experience";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { assertHubAuthForDeclaredAuthor } from "@/lib/hub-auth";
import { syncRuleReviewStats } from "@/lib/skill-review-stats";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postBody = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1),
  author: z.string().min(1).max(100),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") === "helpful" ? "helpful" : "latest";

    const rule = await prisma.rule.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!rule) {
      return jsonErr("Rule 不存在", 404);
    }

    const reviews = await prisma.review.findMany({
      where: { ruleId: rule.id, resourceType: "rule" },
      orderBy:
        sort === "helpful"
          ? [{ isHelpful: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }],
    });

    return jsonOk(reviews);
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const rule = await prisma.rule.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!rule) {
      return jsonErr("Rule 不存在", 404);
    }

    const raw = await req.json();
    const parsed = postBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    assertHubAuthForDeclaredAuthor(req, b.author);

    const auth = await getAuthFromRequest(req);

    let agentLevelUp: { level: number; levelName: string } | null = null;
    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          resourceType: "rule",
          resourceId: rule.id,
          ruleId: rule.id,
          rating: b.rating,
          content: b.content.trim(),
          author: b.author.trim(),
          authorAgentId: auth.agent?.id ?? undefined,
        },
      });
      if (auth.agent && b.rating === 5) {
        const xp = await applyExperienceDelta(tx, auth.agent.id, XP_FIVE_STAR_REVIEW);
        if (xp?.leveledUp) {
          agentLevelUp = { level: xp.level, levelName: xp.levelName };
        }
      }
      return r;
    });

    await syncRuleReviewStats(rule.id);

    return jsonOk({ review, agentLevelUp }, "评测已发布");
  } catch (e) {
    return toApiResponse(e);
  }
}
