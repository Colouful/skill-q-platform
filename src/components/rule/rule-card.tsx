import Link from "next/link";
import type { Category, Rule } from "@/generated/prisma";
import { ClampedCardDescription } from "@/components/card/clamped-card-description";
import { pixelCardVariants } from "@/components/pixel";
import { cn } from "@/lib/utils";
import { HighlightText } from "@/components/skill/highlight-text";

type RuleWithCategory = Rule & { category: Category };

/** 与 SkillCard 相同内边距与层次，仅边框/阴影用柔和 Rule 色、分类用 --rule-accent */
export function RuleCard({
  rule,
  compact,
  highlightQuery,
}: {
  rule: RuleWithCategory;
  compact?: boolean;
  highlightQuery?: string;
}) {
  const hq = highlightQuery?.trim() ?? "";
  return (
    <Link
      href={`/rules/${rule.slug}`}
      className={cn(pixelCardVariants({ tone: "rule" }), "group/card flex h-full flex-col")}
    >
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--rule-accent)]">
        {rule.category.name}
      </p>
      <h3
        className={cn(
          "mt-1 line-clamp-2 min-h-[2.5rem] font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {hq ? <HighlightText text={rule.name} query={hq} /> : rule.name}
      </h3>
      {!compact && (
        <ClampedCardDescription>
          {hq ? <HighlightText text={rule.description} query={hq} /> : rule.description}
        </ClampedCardDescription>
      )}
      <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        ⭐ {rule.rating.toFixed(1)} · ⬇ {rule.downloads}
      </p>
    </Link>
  );
}
