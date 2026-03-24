import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const pixelBorderVariants = cva("border-[var(--pixel-border)]", {
  variants: {
    width: {
      sm: "border-2",
      md: "border-[3px]",
      lg: "border-4",
    },
  },
  defaultVariants: { width: "lg" },
});

export type PixelBorderProps = ComponentProps<"div"> & VariantProps<typeof pixelBorderVariants>;

/** 14.3 统一像素描边厚度 */
export function PixelBorder({ className, width, ...props }: PixelBorderProps) {
  return (
    <div className={cn(pixelBorderVariants({ width }), className)} {...props} />
  );
}
