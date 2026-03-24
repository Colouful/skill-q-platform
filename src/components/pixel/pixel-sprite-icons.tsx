import { cn } from "@/lib/utils";

const box = "size-8 shrink-0";

/** 14.10 32×32 像素图标（内联 SVG） */
export function PixelIconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn(box, className)} aria-hidden>
      <rect x="4" y="4" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="10" y="10" width="8" height="8" fill="currentColor" />
      <rect x="20" y="20" width="8" height="6" fill="currentColor" />
    </svg>
  );
}

export function PixelIconStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn(box, "text-[var(--pixel-yellow)]", className)} aria-hidden>
      <rect x="14" y="4" width="4" height="8" fill="currentColor" />
      <rect x="10" y="8" width="12" height="4" fill="currentColor" />
      <rect x="6" y="12" width="20" height="4" fill="currentColor" />
      <rect x="10" y="16" width="4" height="8" fill="currentColor" />
      <rect x="18" y="16" width="4" height="8" fill="currentColor" />
      <rect x="14" y="24" width="4" height="4" fill="currentColor" />
    </svg>
  );
}

export function PixelIconZip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn(box, "text-[var(--pixel-cyan)]", className)} aria-hidden>
      <rect x="8" y="4" width="16" height="24" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="12" y="8" width="8" height="3" fill="currentColor" />
      <rect x="12" y="14" width="8" height="3" fill="currentColor" />
      <rect x="12" y="20" width="8" height="3" fill="currentColor" />
    </svg>
  );
}
