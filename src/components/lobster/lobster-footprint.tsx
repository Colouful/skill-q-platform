import { cn } from "@/lib/utils";

/** 15.8 分页等处的龙虾脚印装饰（像素点阵） */
export function LobsterFootprint({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("inline-block h-3 w-3 text-[var(--pixel-accent)] opacity-70", className)}
      aria-hidden
    >
      <rect x="2" y="4" width="3" height="5" fill="currentColor" />
      <rect x="7" y="3" width="3" height="6" fill="currentColor" />
    </svg>
  );
}
