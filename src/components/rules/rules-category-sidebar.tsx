import Link from "next/link";
import type { Category } from "@/generated/prisma";
import { RuleCategoryPixelIcon } from "@/components/rule/rule-category-pixel-icon";
import { rulesListHref } from "@/lib/rules-list-url";
import { cn } from "@/lib/utils";

/** 5.2.1 列表页桌面侧栏：分类筛选 + 分类专页入口 */
export function RulesCategorySidebar({
  categories,
  categorySlug,
  q,
}: {
  categories: Category[];
  categorySlug?: string;
  q?: string;
}) {
  const navActive =
    "border-2 border-[var(--rule-border)] bg-[var(--pixel-yellow)] px-1.5 py-1 text-[var(--pixel-fg)]";
  const navIdle =
    "border-2 border-transparent px-1.5 py-1 text-[var(--pixel-muted)] transition hover:border-[var(--pixel-border)] hover:shadow-[2px_2px_0_0_var(--pixel-border)]";
  const specLink =
    "shrink-0 text-[10px] leading-tight text-[var(--rule-accent)] underline decoration-[var(--rule-border)] decoration-1 underline-offset-2 hover:text-[var(--pixel-fg)]";

  return (
    <aside
      className="w-full space-y-1.5 border-4 border-[var(--rule-border)] bg-[#fffef8] p-2 font-[family-name:var(--font-pixel-body)] text-xs shadow-[var(--hub-shadow-card-rule)]"
      aria-label="Rule 分类导航"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--rule-accent)]">
        分类
      </p>
      <Link
        href={rulesListHref({ q, category: undefined })}
        className={cn("block rounded-sm", !categorySlug ? navActive : navIdle)}
      >
        全部
      </Link>
      <ul className="space-y-0">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex min-h-0 items-center gap-1 border-b border-[var(--pixel-border)]/25 py-1 last:border-0"
          >
            <Link
              href={rulesListHref({ q, category: c.slug })}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1 rounded-sm",
                categorySlug === c.slug ? navActive : navIdle,
              )}
            >
              <RuleCategoryPixelIcon slug={c.slug} className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{c.name}</span>
            </Link>
            <Link
              href={`/categories/rules/${encodeURIComponent(c.slug)}`}
              className={specLink}
              title={`${c.name} 分类专页`}
            >
              分类专页→
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
