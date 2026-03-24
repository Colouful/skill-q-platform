import Link from "next/link";
import { searchPageHref } from "@/lib/search-page-url";

const POPULAR = ["规则", "workflow", "lint", "评分", "模板"];

export function SearchPopularChips() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        试试
      </span>
      {POPULAR.map((t) => (
        <Link
          key={t}
          href={searchPageHref(t, "all")}
          className="border border-dashed border-[var(--pixel-border)] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)] hover:border-[var(--pixel-border)] hover:bg-[#fffef8] hover:text-[var(--pixel-fg)]"
        >
          {t}
        </Link>
      ))}
    </div>
  );
}
