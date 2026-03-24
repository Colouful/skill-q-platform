import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 14.4 32×32 像素图标容器（内嵌 SVG 或 emoji） */
export function PixelIcon({
  className,
  children,
  label,
  ...props
}: ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center border-4 border-[var(--pixel-border)] bg-[#fffef8] shadow-[2px_2px_0_0_var(--pixel-border)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
