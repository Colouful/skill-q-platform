import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { ApiError, toApiResponse } from "@/lib/api-errors";
import { assertSkillRuleWriteAccess } from "@/lib/skill-rule-write-access";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const existing = await prisma.skill.findUnique({ where: { slug } });
    if (!existing) {
      throw new ApiError("Skill 不存在", 404);
    }

    await assertSkillRuleWriteAccess(req, {
      authorAgentId: existing.authorAgentId,
      author: existing.author,
    });

    await prisma.skill.delete({ where: { slug } });

    return jsonOk({ deleted: true, slug }, "已删除");
  } catch (e) {
    return toApiResponse(e);
  }
}
