import Link from "next/link";
import type { Category, Skill } from "@/generated/prisma";
import { ClampedCardDescription } from "@/components/card/clamped-card-description";
import { pixelCardVariants } from "@/components/pixel";
import { cn } from "@/lib/utils";
import { HighlightText } from "./highlight-text";

type SkillWithCategory = Skill & { category: Category };

export function SkillCard({
  skill,
  compact,
  highlightQuery,
}: {
  skill: SkillWithCategory;
  compact?: boolean;
  /** 12.3 与搜索词匹配时高亮标题/描述 */
  highlightQuery?: string;
}) {
  const hq = highlightQuery?.trim() ?? "";
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className={cn(pixelCardVariants(), "group/card flex h-full flex-col")}
    >
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
        {skill.category.name}
      </p>
      <h3
        className={cn(
          "mt-1 line-clamp-2 min-h-[2.5rem] font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        {hq ? <HighlightText text={skill.name} query={hq} /> : skill.name}
      </h3>
      {!compact && (
        <ClampedCardDescription>
          {hq ? <HighlightText text={skill.description} query={hq} /> : skill.description}
        </ClampedCardDescription>
      )}
      <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        ⭐ {skill.rating.toFixed(1)} · ⬇ {skill.downloads}
      </p>
    </Link>
  );
}
