import { prisma } from "@/lib/prisma";
import { DiscoverSkillList } from "@/components/discover/discover-skill-list";

export const dynamic = "force-dynamic";

/** 12.6 最新上架：按创建时间 */
export default async function NewSkillsPage() {
  const skills = await prisma.skill.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <DiscoverSkillList title="最新上架" subtitle="刚入库的 Skill，抢先体验" skills={skills} />
    </div>
  );
}
