import { prisma } from "@/lib/prisma";

/** 根据 reviews 表重算 Skill 的 rating（平均分）与 reviewCount */
export async function syncSkillReviewStats(skillId: string) {
  const [avgRow, count] = await Promise.all([
    prisma.review.aggregate({
      where: { skillId, resourceType: "skill" },
      _avg: { rating: true },
    }),
    prisma.review.count({ where: { skillId, resourceType: "skill" } }),
  ]);
  await prisma.skill.update({
    where: { id: skillId },
    data: {
      rating: avgRow._avg.rating ?? 0,
      reviewCount: count,
    },
  });
}

/** 根据 reviews 表重算 Rule 的 rating 与 reviewCount */
export async function syncRuleReviewStats(ruleId: string) {
  const [avgRow, count] = await Promise.all([
    prisma.review.aggregate({
      where: { ruleId, resourceType: "rule" },
      _avg: { rating: true },
    }),
    prisma.review.count({ where: { ruleId, resourceType: "rule" } }),
  ]);
  await prisma.rule.update({
    where: { id: ruleId },
    data: {
      rating: avgRow._avg.rating ?? 0,
      reviewCount: count,
    },
  });
}
