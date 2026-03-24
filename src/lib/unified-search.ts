import { type Category, type Prisma, type Rule, type Skill } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type UnifiedSearchType = "all" | "skill" | "rule";

export type SkillWithCategory = Skill & { category: Category };
export type RuleWithCategory = Rule & { category: Category };

const LIMIT = 15;

export async function runUnifiedSearch(
  q: string,
  type: UnifiedSearchType,
): Promise<{ skills: SkillWithCategory[]; rules: RuleWithCategory[] }> {
  const trimmed = q.trim();
  if (!trimmed) {
    return { skills: [], rules: [] };
  }

  const skillWhere: Prisma.SkillWhereInput = {
    OR: [
      { name: { contains: trimmed } },
      { description: { contains: trimmed } },
      { slug: { contains: trimmed } },
    ],
  };
  const ruleWhere: Prisma.RuleWhereInput = {
    OR: [
      { name: { contains: trimmed } },
      { description: { contains: trimmed } },
      { slug: { contains: trimmed } },
    ],
  };

  const [skills, rules] = await Promise.all([
    type === "rule"
      ? Promise.resolve([] as SkillWithCategory[])
      : prisma.skill.findMany({
          where: skillWhere,
          include: { category: true },
          orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
          take: LIMIT,
        }),
    type === "skill"
      ? Promise.resolve([] as RuleWithCategory[])
      : prisma.rule.findMany({
          where: ruleWhere,
          include: { category: true },
          orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
          take: LIMIT,
        }),
  ]);

  return { skills, rules };
}
