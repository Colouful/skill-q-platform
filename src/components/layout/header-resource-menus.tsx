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

  const onInstallPath = pathname === "/install" || (pathname?.startsWith("/install/") ?? false);
  const onScenarioPath =
    !onInstallPath &&
    (pathname === "/scenarios" || (pathname?.startsWith("/scenarios/") ?? false));
  const onRulePath =
    !onScenarioPath &&
    !onInstallPath &&
    (pathname === "/rules" ||
      (pathname?.startsWith("/rules/") ?? false) ||
      (pathname?.startsWith("/categories/rules/") ?? false));
  const onSkillPath =
    !onScenarioPath &&
    !onInstallPath &&
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
      <Link
        href="/scenarios"
        className={cn(
          "transition-colors hover:text-[var(--pixel-fg)]",
          onScenarioPath ? "text-[var(--pixel-fg)]" : "text-[var(--pixel-muted)]",
        )}
        title="场景方案列表"
      >
        场景方案
      </Link>
      <Link
        href="/install"
        className={cn(
          "transition-colors hover:text-[var(--pixel-fg)]",
          onInstallPath ? "text-[var(--pixel-fg)]" : "text-[var(--pixel-muted)]",
        )}
        title="项目接入入口"
      >
        项目接入
      </Link>
    </div>
  );
}
