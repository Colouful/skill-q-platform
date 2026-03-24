"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/** 顶栏左上角：上传入口，像素街机券风格 */
export function HeaderUploadCta() {
  const pathname = usePathname();
  const active = pathname?.startsWith("/skills/upload");

  return (
    <Link
      href="/skills/upload"
      className={cn(
        "group relative flex shrink-0 items-center gap-1.5 overflow-visible border-4 border-[var(--pixel-border)]",
        "bg-[linear-gradient(145deg,var(--pixel-yellow)_0%,#f0d060_45%,var(--pixel-yellow)_100%)]",
        "px-2 py-1.5 sm:px-3 sm:py-2",
        "font-[family-name:var(--font-pixel-body)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pixel-fg)]",
        "shadow-[var(--hub-shadow-card-skill)]",
        "transition-[transform,box-shadow] duration-75",
        "hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--pixel-border)]",
        "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--pixel-border)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pixel-bg)]",
        active &&
          "ring-2 ring-[var(--pixel-accent)] ring-offset-2 ring-offset-[var(--pixel-bg)]",
      )}
      aria-current={active ? "page" : undefined}
    >
      {/* 像素铆钉 */}
      <span
        className="pointer-events-none absolute -left-px -top-px h-1 w-1 bg-[var(--pixel-border)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-px -right-px h-1 w-1 bg-[var(--pixel-border)]"
        aria-hidden
      />
      <span className="relative flex items-center gap-1 sm:gap-1.5">
        <Upload
          className="h-3.5 w-3.5 shrink-0 motion-safe:transition-transform motion-safe:group-hover:-translate-y-px sm:h-4 sm:w-4"
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="leading-none">
          <span className="hidden sm:inline">丢个 ZIP</span>
          <span className="sm:hidden">ZIP</span>
        </span>
      </span>
      {/* 街机票根缺口 */}
      <span
        className="pointer-events-none absolute -bottom-1 left-2 h-2 w-2 rounded-full border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-1 right-2 h-2 w-2 rounded-full border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)]"
        aria-hidden
      />
      {/* 角标 */}
      <span
        className="absolute -right-1.5 -top-2 flex min-w-[1.25rem] rotate-6 items-center justify-center border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-0.5 py-0.5 text-[9px] font-bold leading-none tracking-normal text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] sm:-right-2 sm:min-w-[1.5rem] sm:text-[10px]"
        aria-hidden
      >
        ⇪
      </span>
    </Link>
  );
}
