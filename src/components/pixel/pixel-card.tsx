import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** 与顶栏「丢个 ZIP」等块一致：粗描边 + 右下错位投影（像素块层次） */
export const pixelCardVariants = cva(
  "pixel-card-frame relative z-0 block border-4 bg-[#fffef8] transition-shadow duration-150 hover:z-10 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-cyan)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pixel-bg)]",
  {
    variants: {
      tone: {
        skill:
          "pixel-card-frame--skill border-[var(--pixel-border)] shadow-[4px_4px_0_0_var(--pixel-border)] hover:shadow-[3px_3px_0_0_var(--pixel-border)]",
        rule:
          "pixel-card-frame--rule border-[var(--rule-border)] shadow-[4px_4px_0_0_var(--rule-shadow)] hover:shadow-[3px_3px_0_0_var(--rule-shadow)]",
      },
      padding: {
        default: "p-4",
        compact: "p-3",
        none: "p-0",
      },
    },
    defaultVariants: { padding: "default", tone: "skill" },
  },
);

export type PixelCardProps = ComponentProps<"div"> & VariantProps<typeof pixelCardVariants>;

/** 14.1 像素卡片容器；tone=rule 时自动使用紫色 Rule 边框与阴影（7.4.3） */
export function PixelCard({
  className,
  padding,
  tone,
  ...props
}: PixelCardProps) {
  return (
    <div className={cn(pixelCardVariants({ padding, tone }), className)} {...props} />
  );
}
