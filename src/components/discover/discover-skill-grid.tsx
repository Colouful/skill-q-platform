import type { Category, Skill } from "@/generated/prisma";
import { SkillCard } from "@/components/skill/skill-card";
import { VirtualizedDiscoverSkillGrid } from "@/components/discover/virtualized-discover-skill-grid";

type SkillRow = Skill & { category: Category };

export function DiscoverSkillGrid({ skills }: { skills: SkillRow[] }) {
  if (skills.length === 0) {
    return (
      <p className="py-8 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        暂无 Skill
      </p>
    );
  }

  if (skills.length > 24) {
    return <VirtualizedDiscoverSkillGrid skills={skills} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {skills.map((s) => (
        <div key={s.id} className="skill-card-cv min-w-0">
          <SkillCard skill={s} />
        </div>
      ))}
    </div>
  );
}
