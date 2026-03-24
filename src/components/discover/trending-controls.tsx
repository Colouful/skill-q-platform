import Link from "next/link";
import { cn } from "@/lib/utils";
import { ResourceTypeFilter } from "@/components/discover/resource-type-filter";
import {
  trendingHref,
  type TrendingLimit,
  type TrendingResourceType,
  type TrendingSort,
} from "@/lib/trending-query";

function chip(
  active: boolean,
  ruleTone?: boolean,
): string {
  return cn(
    "border-2 px-2 py-1 font-[family-name:var(--font-pixel-body)] text-xs transition",
    active
      ? ruleTone
        ? "border-[var(--rule-border)] bg-[var(--pixel-yellow)] text-[var(--pixel-fg)]"
        : "border-[var(--pixel-border)] bg-[var(--pixel-yellow)] text-[var(--pixel-fg)]"
      : "border-transparent text-[var(--pixel-muted)] hover:border-[var(--pixel-border)] hover:bg-[#fffef8]",
  );
}

/** 6.3.2 / 6.3.6：榜单类型、条数、排序切换 */
export function TrendingControls(props: {
  type: TrendingResourceType;
  limit: TrendingLimit;
  sort: TrendingSort;
}) {
  const c = props;

  return (
    <div className="space-y-4 font-[family-name:var(--font-pixel-body)] text-sm">
      <ResourceTypeFilter
        active={c.type}
        links={{
          skill: trendingHref(c, { type: "skill" }),
          rule: trendingHref(c, { type: "rule" }),
          all: trendingHref(c, { type: "all" }),
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--pixel-muted)]">条数</span>
        {([10, 50, 100] as const).map((n) => (
          <Link
            key={n}
            href={trendingHref(c, { limit: n })}
            className={chip(c.limit === n)}
          >
            Top {n}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--pixel-muted)]">排序</span>
        {(
          [
            { id: "downloads" as const, label: "下载" },
            { id: "rating" as const, label: "评分" },
            { id: "recent" as const, label: "新鲜" },
          ] as const
        ).map(({ id, label }) => (
          <Link
            key={id}
            href={trendingHref(c, { sort: id })}
            className={chip(c.sort === id)}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
