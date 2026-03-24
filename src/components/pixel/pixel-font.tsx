import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  heading: "font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]",
  body: "font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]",
  muted: "font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]",
  accent: "font-[family-name:var(--font-pixel-body)] text-[var(--pixel-accent)]",
} as const;

/** 14.5 统一像素字体层级（Press Start 2P / VT323） */
export function PixelFont({
  variant = "body",
  className,
  ...props
}: ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return <span className={cn(variants[variant], className)} {...props} />;
}
