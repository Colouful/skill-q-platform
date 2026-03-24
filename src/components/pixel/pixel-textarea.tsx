import type { ComponentProps } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { pixelFormControlClassName } from "@/lib/pixel-form-classes";

/** 14.6 像素风格多行输入 */
export function PixelTextarea({ className, ...props }: ComponentProps<typeof Textarea>) {
  return (
    <Textarea className={cn(pixelFormControlClassName, "min-h-20", className)} {...props} />
  );
}
