"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  hint: string;
  match: (pathname: string | null) => boolean;
};

type Variant = "bar" | "drawer";

function buildDiscoverItems(pathname: string | null): Item[] {
  const ruleContext =
    (pathname?.startsWith("/rules") ?? false) ||
    (pathname?.startsWith("/categories/rules/") ?? false);

  const trendingHref = ruleContext ? "/trending?type=rule" : "/trending";

  return [
    {
      href: trendingHref,
      label: "热门",
      hint: ruleContext ? "Rule" : "Skill",
      match: (p) => p === "/trending" || (p?.startsWith("/trending?") ?? false),
    },
    {
      href: "/top-rated",
      label: "高分",
      hint: "Skill",
      match: (p) => p === "/top-rated" || (p?.startsWith("/top-rated/") ?? false),
    },
    {
      href: "/new",
      label: "上新",
      hint: "Skill",
      match: (p) => p === "/new" || (p?.startsWith("/new/") ?? false),
    },
  ];
}

/**
 * 顶栏「发现」：热门按当前上下文分流（Rule 区 → Rule 热门）；高分/上新均为 Skill 榜单并带 hint。
 */
export function HeaderDiscoverNav({
  className,
  variant = "bar",
}: {
  className?: string;
  variant?: Variant;
}) {
  const pathname = usePathname();
  const items = buildDiscoverItems(pathname);

  const inner = items.map((item) => {
    const active = item.match(pathname);

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        title={`${item.label}（${item.hint}）`}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)] font-bold text-[var(--pixel-fg)] transition-colors",
          variant === "bar" &&
            "min-h-[1.75rem] min-w-0 border-l-2 px-1 py-0.5 text-[8px] uppercase tracking-wide first:border-l-0 sm:min-h-8 sm:px-1.5 sm:text-[9px] md:px-2 md:text-[10px]",
          variant === "drawer" &&
            "border-b-[3px] px-3 py-3 text-sm last:border-b-0 sm:flex-row sm:justify-between sm:gap-4",
          active
            ? "bg-[var(--pixel-yellow)] shadow-[inset_0_-3px_0_0_var(--pixel-border)]"
            : "bg-[linear-gradient(180deg,#fffef8_0%,#ebe4d4_100%)] hover:bg-[var(--pixel-cyan)]/25",
        )}
      >
        <span className="leading-none">{item.label}</span>
        {variant === "drawer" && (
          <span className="text-[10px] font-normal text-[var(--pixel-muted)]">
            {item.hint}
          </span>
        )}
      </Link>
    );
  });

  if (variant === "drawer") {
    return (
      <nav
        aria-label="发现榜单"
        className={cn(
          "flex flex-col overflow-hidden border-4 border-[var(--pixel-border)] bg-[var(--hub-surface-elevated)] shadow-[var(--hub-shadow-card-skill)]",
          className,
        )}
      >
        {inner}
      </nav>
    );
  }

  return (
    <nav
      aria-label="发现榜单"
      className={cn(
        "flex max-w-[min(100%,14rem)] items-stretch overflow-hidden border-4 border-[var(--pixel-border)] bg-[var(--hub-surface-elevated)] shadow-[var(--hub-shadow-card-skill)] sm:max-w-[min(100%,16rem)]",
        className,
      )}
    >
      {inner}
    </nav>
  );
}
