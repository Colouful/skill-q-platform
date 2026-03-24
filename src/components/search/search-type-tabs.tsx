"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { searchPageHref } from "@/lib/search-page-url";
import type { UnifiedSearchType } from "@/lib/unified-search";

export function SearchTypeTabs({
  q,
  active,
}: {
  q: string;
  active: UnifiedSearchType;
}) {
  const tabs: { type: UnifiedSearchType; label: string }[] = [
    { type: "all", label: "全部" },
    { type: "skill", label: "Skill" },
    { type: "rule", label: "Rule" },
  ];

  return (
    <div
      className="flex flex-wrap gap-2 font-[family-name:var(--font-pixel-body)] text-sm"
      role="tablist"
      aria-label="资源类型"
    >
      {tabs.map(({ type, label }) => (
        <Link
          key={type}
          href={searchPageHref(q, type)}
          scroll={false}
          role="tab"
          aria-selected={active === type}
          className={cn(
            "border-2 px-3 py-1 transition",
            active === type
              ? "border-[var(--pixel-border)] bg-[var(--pixel-yellow)] text-[var(--pixel-fg)]"
              : "border-transparent text-[var(--pixel-muted)] hover:border-[var(--pixel-border)] hover:bg-[#fffef8]",
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
