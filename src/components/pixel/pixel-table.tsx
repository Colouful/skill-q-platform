import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** 14.8 像素风表格容器 */
export function PixelTable({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto border-4 border-[var(--pixel-border)] bg-[#fffef8] shadow-[4px_4px_0_0_var(--pixel-border)]">
      <table
        className={cn(
          "w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function PixelTableHead({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/30", className)}
      {...props}
    />
  );
}

export function PixelTableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b-2 border-[var(--pixel-border)]/40 odd:bg-[#fffef8] even:bg-[#f7f3e8]/80", className)}
      {...props}
    />
  );
}
