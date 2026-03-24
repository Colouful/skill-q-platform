import { prisma } from "@/lib/prisma";
import { DiscoverSkillList } from "@/components/discover/discover-skill-list";

export const dynamic = "force-dynamic";

/** 12.5 高分：按评分 */
export default async function TopRatedPage() {
  const skills = await prisma.skill.findMany({
    include: { category: true },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { updatedAt: "desc" }],
    take: 48,
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <DiscoverSkillList title="高分榜单" subtitle="按综合评分与评测数量排序" skills={skills} />
    </div>
  );
}
