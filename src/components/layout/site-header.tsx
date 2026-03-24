"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UnifiedSearchBar } from "@/components/search/unified-search-bar";
import { HeaderResourceMenus } from "@/components/layout/header-resource-menus";
import { HeaderUploadCta } from "@/components/layout/header-upload-cta";
import { HeaderDiscoverNav } from "@/components/layout/header-discover-nav";
import { HeaderAgentAuth } from "@/components/layout/header-agent-auth";
import { ThemeSwitcher } from "@/themes/ThemeSwitcher";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  const NavMainLinks = ({ mobile }: { mobile?: boolean }) => (
    <nav
      aria-label="主导航"
      className={cn(
        "flex gap-6 font-[family-name:var(--font-pixel-body)] text-sm font-medium tracking-wide",
        mobile ? "flex-col px-4 pb-2" : "items-center",
      )}
    >
      <Link
        href="/"
        className={cn(
          "transition-colors hover:text-[var(--pixel-fg)]",
          pathname === "/" ? "text-[var(--pixel-fg)]" : "text-[var(--pixel-muted)]",
        )}
      >
        首页
      </Link>
      <HeaderResourceMenus mobile={mobile} />
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)]">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 lg:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
          <HeaderUploadCta />
          <Link
            href="/"
            className="shrink-0 font-[family-name:var(--font-pixel-heading)] text-sm font-normal tracking-tight text-[var(--pixel-fg)] sm:text-base"
          >
            虾球Hub
          </Link>
          <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-1.5 md:flex md:gap-2 lg:gap-3">
            <NavMainLinks />
            <HeaderDiscoverNav className="hidden min-w-0 shrink-0 md:flex" />
          </div>
        </div>
        {/* 右侧：搜索（md+）→ 登录/身份 → 移动端抽屉 */}
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
          <Suspense
            fallback={<div className="hidden h-9 w-[min(280px,36vw)] shrink-0 md:block" aria-hidden />}
          >
            <UnifiedSearchBar />
          </Suspense>
          <ThemeSwitcher className="hidden sm:block" />
          <HeaderAgentAuth className="inline-flex shrink-0" />
          <Sheet>
            <SheetTrigger
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-sm border-4 border-[var(--pixel-border)] bg-[#fffef8] text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-cyan)]/40 md:hidden",
              )}
              aria-label="打开菜单"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-l-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)]">
              <div className="flex flex-col gap-4 pt-2">
                <p className="px-1 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-muted)] sm:hidden">
                  榜单
                </p>
                <HeaderDiscoverNav variant="drawer" className="sm:hidden" />
                <Suspense fallback={<div className="h-9 w-full rounded border-2 border-[var(--pixel-border)]/40 bg-muted/20" />}>
                  <UnifiedSearchBar variant="drawer" />
                </Suspense>
                <p className="px-1 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-muted)]">
                  导航
                </p>
                <div className="flex flex-col gap-2 px-1 md:hidden">
                  <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-muted)]">
                    主题
                  </p>
                  <ThemeSwitcher className="w-full [&_button]:w-full [&_button]:max-w-none [&_button]:justify-center" />
                  <HeaderAgentAuth className="w-full max-w-none justify-start" />
                </div>
                <NavMainLinks mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
