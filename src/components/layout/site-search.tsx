"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PixelInput } from "@/components/pixel";
import { Search } from "lucide-react";

/** 12.1 顶栏像素风搜索：与 /skills?q= 联动（12.2 实时跳转列表） */
export function SiteSearch({ variant = "header" }: { variant?: "header" | "drawer" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const v = q.trim();
      const cur = searchParams.get("q")?.trim() ?? "";
      if (v === cur) return;
      const next = v ? `/skills?q=${encodeURIComponent(v)}` : "/skills";
      startTransition(() => {
        router.replace(next);
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [q, router, searchParams]);

  return (
    <div
      className={
        variant === "drawer"
          ? "relative w-full min-w-0 md:hidden"
          : "relative hidden min-w-0 max-w-[200px] sm:max-w-[260px] md:block lg:max-w-xs"
      }
    >
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pixel-muted)]"
        aria-hidden
      />
      <PixelInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索 Skill…"
        className="h-9 bg-[#fffef8] pl-9 text-sm"
        aria-busy={pending}
        aria-label="搜索 Skill"
      />
      {pending && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--pixel-muted)]">
          …
        </span>
      )}
    </div>
  );
}
