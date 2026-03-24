import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** 像素风：固定 4px 描边 + 硬错位投影；Apple/手绘 由 globals 对 .border-4 单独覆盖 */
export const pixelButtonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-none border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)] font-medium text-[var(--pixel-fg)] transition hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-[var(--pixel-border)] bg-[var(--pixel-yellow)] shadow-[4px_4px_0_0_var(--pixel-border)] hover:shadow-[3px_3px_0_0_var(--pixel-border)]",
        cyan: "border-[var(--pixel-border)] bg-[var(--pixel-cyan)] shadow-[4px_4px_0_0_var(--pixel-border)] hover:shadow-[3px_3px_0_0_var(--pixel-border)]",
        outline:
          "border-[var(--pixel-border)] bg-[#fffef8] shadow-[3px_3px_0_0_var(--pixel-border)] hover:bg-[var(--pixel-cyan)]/15",
        rule:
          "border-[var(--rule-border)] bg-[color-mix(in_srgb,var(--rule-accent)_14%,#fffef8)] shadow-[4px_4px_0_0_var(--rule-shadow)] hover:shadow-[3px_3px_0_0_var(--rule-shadow)]",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type PixelButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof pixelButtonVariants>;

/** 14.2 像素主按钮（原生 button，表单/编辑器用） */
export const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(pixelButtonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
PixelButton.displayName = "PixelButton";
