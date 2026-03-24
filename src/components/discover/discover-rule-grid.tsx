import type { Category, Rule } from "@/generated/prisma";
import { RuleCard } from "@/components/rule/rule-card";

type RuleRow = Rule & { category: Category };

export function DiscoverRuleGrid({ rules }: { rules: RuleRow[] }) {
  if (rules.length === 0) {
    return (
      <p className="py-8 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        暂无 Rule
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rules.map((r) => (
        <div key={r.id} className="skill-card-cv min-w-0">
          <RuleCard rule={r} />
        </div>
      ))}
    </div>
  );
}
