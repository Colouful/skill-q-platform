"use client";

import { useTheme } from "@/themes/useTheme";
import { cn } from "@/lib/utils";

/** 主题切换瞬间的轻遮罩，减轻 View Transition 时的闪烁感 */
export function ThemeTransitionOverlay() {
  const { isTransitioning, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "theme-transition-overlay pointer-events-none fixed inset-0 z-[9997] bg-[var(--background)] transition-opacity duration-200 ease-out motion-reduce:opacity-0",
        isTransitioning ? "opacity-[0.12] will-change-[opacity]" : "opacity-0",
      )}
    />
  );
}
