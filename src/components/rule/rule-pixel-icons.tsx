import { cn } from "@/lib/utils";

/** 7.2.x Rule 操作/状态像素风小图标（内联 SVG，紫色系） */
export function RuleIconDownload({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-4 w-4 text-[var(--rule-accent)]", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M2 12h12v2H2v-2zm6-8v6l3-3h-2V4H7v3L4 7l3 3V4z"
      />
    </svg>
  );
}

export function RuleIconFork({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-4 w-4 text-[var(--rule-accent)]", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M5 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM5 10c0-1 1-2 2-2h2c1 0 2 1 2 2v4H5v-4zm6-4c-1 0-2 .5-2.5 1.2A3 3 0 0 1 8 6a3 3 0 0 1-2.5 1.2C5 6.5 4 6 3 6v2c1 0 2 .5 2.5 1.2.5-.7 1.5-1.2 2.5-1.2s2 .5 2.5 1.2C11 8.5 12 8 13 8V6z"
      />
    </svg>
  );
}

export function RuleIconEdit({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-4 w-4 text-[var(--rule-accent)]", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M11.5 2l2.5 2.5-8 8H3v-3l8-8zm1 1.5L11 3 4 10v2h2l7-7-1.5-1.5z"
      />
    </svg>
  );
}

export function RuleIconSuccess({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-4 w-4 text-[var(--rule-accent)]", className)}
      aria-hidden
    >
      <path fill="currentColor" d="M6.5 12L2 7.5l1.4-1.4 3.1 3.1 6.1-6.1L14 4.6 6.5 12z" />
    </svg>
  );
}

export function RuleIconWarn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-4 w-4 text-[var(--pixel-yellow)]", className)}
      aria-hidden
    >
      <path fill="currentColor" d="M8 2L1 14h14L8 2zm0 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-1-2V7h2v4H7z" />
    </svg>
  );
}

export function RuleIconBook({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-4 w-4 text-[var(--rule-accent)]", className)}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M3 2h7a2 2 0 0 1 2 2v10H5a2 2 0 0 0-2 2H2V4a2 2 0 0 1 1-2zm0 2v10h7V4H4a2 2 0 0 0-2 2z"
      />
    </svg>
  );
}
