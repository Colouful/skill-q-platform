"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Skill / Rule 顶栏入口：使用普通链接，避免下拉组件在部分环境下的运行时问题。
 * 分类筛选在 /skills、/rules 列表页与侧栏。
 */
export function HeaderResourceMenus({ mobile }: { mobile?: boolean }) {
  const pathname = usePathname();

  const onRulePath =
    pathname === "/rules" ||
    (pathname?.startsWith("/rules/") ?? false) ||
    (pathname?.startsWith("/categories/rules/") ?? false);
  const onSkillPath =
    !onRulePath &&
    (pathname === "/skills" ||
      (pathname?.startsWith("/skills/") ?? false) ||
      (pathname?.startsWith("/categories/") ?? false));

  return (
    <div
      className={cn(
        "flex gap-6 font-[family-name:var(--font-pixel-body)] text-sm font-medium tracking-wide",
        mobile ? "flex-col px-4" : "items-center",
      )}
    >
      <Link
        href="/skills"
        className={cn(
          "transition-colors hover:text-[var(--pixel-fg)]",
          onSkillPath ? "text-[var(--pixel-fg)]" : "text-[var(--pixel-muted)]",
        )}
        title="Skill 列表（分类筛选在列表页）"
      >
        Skill
      </Link>
      <Link
        href="/rules"
        className={cn(
          "transition-colors hover:text-[var(--pixel-fg)]",
          onRulePath ? "text-[var(--pixel-fg)]" : "text-[var(--pixel-muted)]",
        )}
        title="Rule 列表（分类筛选在列表页）"
      >
        Rule
      </Link>
    </div>
  );
}
