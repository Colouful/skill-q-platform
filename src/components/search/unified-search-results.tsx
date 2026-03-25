import Link from "next/link";
import type { SkillWithCategory, RuleWithCategory } from "@/lib/unified-search";
import { rulePath, skillPath } from "@/lib/slug-url";
import { HighlightText } from "@/components/skill/highlight-text";

export function UnifiedSearchResults({
  q,
  skills,
  rules,
}: {
  q: string;
  skills: SkillWithCategory[];
  rules: RuleWithCategory[];
}) {
  const hq = q.trim();

  if (!hq) {
    return (
      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        输入关键词开始搜索 Skill 与 Rule。
      </p>
    );
  }

  const empty = skills.length === 0 && rules.length === 0;

  if (empty) {
    return (
      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        没有匹配「{hq}」的结果，换个词试试。
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {skills.length > 0 && (
        <section aria-labelledby="search-skills-heading">
          <h2
            id="search-skills-heading"
            className="border-b-2 border-[var(--pixel-border)] pb-2 font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-accent)]"
          >
            Skills（{skills.length}）
          </h2>
          <ul className="mt-4 space-y-3">
            {skills.map((s) => (
              <li
                key={s.id}
                className="border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm"
              >
                <Link
                  href={skillPath(s.slug)}
                  className="font-medium text-[var(--pixel-fg)] underline decoration-[var(--pixel-border)] decoration-2 underline-offset-2 hover:text-[var(--pixel-accent)]"
                >
                  <HighlightText text={s.name} query={hq} />
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--pixel-muted)]">
                  <HighlightText text={s.description} query={hq} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rules.length > 0 && (
        <section aria-labelledby="search-rules-heading">
          <h2
            id="search-rules-heading"
            className="border-b-2 border-[var(--rule-border)] pb-2 font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--rule-accent)]"
          >
            Rules（{rules.length}）
          </h2>
          <ul className="mt-4 space-y-3">
            {rules.map((r) => (
              <li
                key={r.id}
                className="border-2 border-[var(--rule-border)] bg-[#fffef8] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm"
              >
                <Link
                  href={rulePath(r.slug)}
                  className="font-medium text-[var(--pixel-fg)] underline decoration-[var(--rule-border)] decoration-2 underline-offset-2 hover:text-[var(--rule-accent)]"
                >
                  <HighlightText text={r.name} query={hq} />
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--pixel-muted)]">
                  <HighlightText text={r.description} query={hq} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
