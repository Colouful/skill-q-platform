"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PixelInput } from "@/components/pixel";
import { Search } from "lucide-react";
import { searchPageHref } from "@/lib/search-page-url";
import type { UnifiedSearchType } from "@/lib/unified-search";

function inferTypeFromPath(pathname: string | null): UnifiedSearchType {
  if (!pathname) return "all";
  if (pathname === "/rules" || pathname.startsWith("/rules/")) return "rule";
  if (pathname === "/skills" || pathname.startsWith("/skills/")) return "skill";
  return "all";
}

/** 顶栏 / 抽屉 / 搜索页：全局搜索，落地 /search；在 Skill/Rule 列表页仍写入各自 ?q= 以保持列表联动 */
export function UnifiedSearchBar({
  variant = "header",
}: {
  variant?: "header" | "drawer" | "page";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const scopeType = useMemo(() => inferTypeFromPath(pathname), [pathname]);

  useEffect(() => {
    if (pathname === "/search") {
      setQ(searchParams.get("q") ?? "");
      return;
    }
    if (pathname?.startsWith("/skills")) {
      setQ(searchParams.get("q") ?? "");
      return;
    }
    if (pathname?.startsWith("/rules")) {
      setQ(searchParams.get("q") ?? "");
      return;
    }
    setQ("");
  }, [pathname, searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const v = q.trim();
      if (pathname === "/search") {
        const typeRaw = searchParams.get("type");
        const type: UnifiedSearchType =
          typeRaw === "skill" || typeRaw === "rule" ? typeRaw : "all";
        const curQ = searchParams.get("q")?.trim() ?? "";
        if (v === curQ) return;
        startTransition(() => {
          router.replace(searchPageHref(v, type));
        });
        return;
      }

      if (pathname?.startsWith("/skills")) {
        const cur = searchParams.get("q")?.trim() ?? "";
        if (v === cur) return;
        startTransition(() => {
          router.replace(v ? `/skills?q=${encodeURIComponent(v)}` : "/skills");
        });
        return;
      }

      if (pathname?.startsWith("/rules")) {
        const cur = searchParams.get("q")?.trim() ?? "";
        if (v === cur) return;
        startTransition(() => {
          router.replace(v ? `/rules?q=${encodeURIComponent(v)}` : "/rules");
        });
        return;
      }

      if (v.length === 0) return;
      startTransition(() => {
        router.push(searchPageHref(v, scopeType));
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [q, pathname, router, searchParams, scopeType]);

  const wrapClass =
    variant === "page"
      ? "relative w-full max-w-xl min-w-0"
      : variant === "drawer"
        ? "relative w-full min-w-0 md:hidden"
        : // 顶栏右侧：与登录区并排，宽度随视口略伸缩
          "relative hidden min-w-0 w-[min(280px,34vw)] max-w-sm md:block lg:w-[min(320px,28vw)]";

  return (
    <div className={wrapClass}>
      <Search
        className={
          variant === "page"
            ? "pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--pixel-muted)]"
            : "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pixel-muted)]"
        }
        aria-hidden
      />
      <PixelInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索 Skill / Rule…"
        className={
          variant === "page"
            ? "h-11 bg-[#fffef8] pl-10 text-base"
            : "h-9 bg-[#fffef8] pl-9 text-sm"
        }
        aria-busy={pending}
        aria-label="搜索 Skill 或 Rule"
      />
      {pending && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--pixel-muted)]">
          …
        </span>
      )}
    </div>
  );
}
