import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { pixelFormControlClassName } from "@/lib/pixel-form-classes";

/** 14.6 像素风格单行输入 */
export function PixelInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input className={cn(pixelFormControlClassName, className)} {...props} />
  );
}
