import Link from "next/link";
import { LobsterFootprint } from "@/components/lobster";
import { skillsListHref } from "@/lib/skills-list-url";
import { cn } from "@/lib/utils";

function hrefForPage(q: string | undefined, page: number, category: string | undefined) {
  return skillsListHref({ q, category, page });
}

function pageItems(totalPages: number, page: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set(
    [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages),
  );
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (i > 0 && cur - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(cur);
  }
  return out;
}

/** 14.9 像素分页 + 15.8 脚印装饰 */
export function SkillsPagination({
  page,
  totalPages,
  q,
  category,
}: {
  page: number;
  totalPages: number;
  q?: string;
  category?: string;
}) {
  if (totalPages <= 1) return null;

  const items = pageItems(totalPages, page);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 border-t-4 border-[var(--pixel-border)] pt-6 font-[family-name:var(--font-pixel-body)] text-sm"
      aria-label="分页"
    >
      <LobsterFootprint />
      <Link
        href={hrefForPage(q, page - 1, category)}
        aria-disabled={page <= 1}
        className={cn(
          "border-2 border-[var(--pixel-border)] px-2 py-1",
          page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[var(--pixel-cyan)]/20",
        )}
      >
        上一页
      </Link>
      {items.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="text-[var(--pixel-muted)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefForPage(q, p, category)}
            className={cn(
              "min-w-8 border-2 border-[var(--pixel-border)] px-2 py-1 text-center",
              p === page
                ? "bg-[var(--pixel-yellow)] font-medium text-[var(--pixel-fg)]"
                : "hover:bg-[var(--pixel-cyan)]/15",
            )}
          >
            {p}
          </Link>
        ),
      )}
      <Link
        href={hrefForPage(q, page + 1, category)}
        aria-disabled={page >= totalPages}
        className={cn(
          "border-2 border-[var(--pixel-border)] px-2 py-1",
          page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-[var(--pixel-cyan)]/20",
        )}
      >
        下一页
      </Link>
      <LobsterFootprint />
    </nav>
  );
}
