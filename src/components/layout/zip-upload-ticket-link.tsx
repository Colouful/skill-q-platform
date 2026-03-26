"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const COPY = {
  skill: { full: "丢个folder", short: "folder", aria: "丢个folder，上传 Skill" },
  rule: { full: "丢个file", short: "file", aria: "丢个file，上传 Rule" },
} as const;

type UploadCopy = (typeof COPY)[keyof typeof COPY];

function copyForUploadHref(href: string): UploadCopy {
  if (href.includes("/rules/upload")) return COPY.rule;
  if (href.includes("/skills/upload")) return COPY.skill;
  return COPY.skill;
}

/** 像素街机券风格上传入口：Skill「丢个folder」、Rule「丢个file」（文案以 href 为准，避免 variant 在 RSC→Client 丢失） */
export function ZipUploadTicketLink(props: {
  href: string;
  /** 可选，便于阅读调用处；展示文案由 href 解析 */
  variant?: keyof typeof COPY;
}) {
  const { href } = props;
  const pathname = usePathname();
  const active = pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
  const { full, short, aria } = copyForUploadHref(href);

  return (
    <Link
      href={href}
      aria-label={aria}
      className={cn(
        "group relative flex shrink-0 items-center gap-1.5 overflow-visible border-4 border-[var(--pixel-border)]",
        "bg-[linear-gradient(145deg,var(--pixel-yellow)_0%,#f0d060_45%,var(--pixel-yellow)_100%)]",
        "px-2 py-1.5 sm:px-3 sm:py-2",
        "font-[family-name:var(--font-pixel-body)] text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pixel-fg)]",
        "shadow-[var(--hub-shadow-card-skill)]",
        "transition-[box-shadow,filter] duration-75",
        /* 不用 translate 做悬停位移：整块上移会让命中区跟着动，贴边时指针反复失焦导致抖动 */
        "hover:shadow-[6px_6px_0_0_var(--pixel-border)] hover:brightness-[1.04]",
        "active:shadow-[2px_2px_0_0_var(--pixel-border)] active:brightness-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pixel-bg)]",
        active &&
          "ring-2 ring-[var(--pixel-accent)] ring-offset-2 ring-offset-[var(--pixel-bg)]",
      )}
      aria-current={active ? "page" : undefined}
    >
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
          className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="leading-none">
          <span className="hidden sm:inline">{full}</span>
          <span className="sm:hidden">{short}</span>
        </span>
      </span>
      <span
        className="pointer-events-none absolute -bottom-1 left-2 h-2 w-2 rounded-full border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-1 right-2 h-2 w-2 rounded-full border-2 border-[var(--pixel-border)] bg-[var(--pixel-bg)]"
        aria-hidden
      />
      <span
        className="absolute -right-1.5 -top-2 flex min-w-[1.25rem] rotate-6 items-center justify-center border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-0.5 py-0.5 text-[9px] font-bold leading-none tracking-normal text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] sm:-right-2 sm:min-w-[1.5rem] sm:text-[10px]"
        aria-hidden
      >
        ⇪
      </span>
    </Link>
  );
}
