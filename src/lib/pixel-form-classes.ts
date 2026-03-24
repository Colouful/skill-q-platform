import { cn } from "@/lib/utils";

/** 文本输入 / 多行：与全站像素表单一致（粗边框 + 直角 + 正文字体） */
export const pixelFormControlClassName = cn(
  "!rounded-none border-4 border-[var(--pixel-border)] bg-transparent font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pixel-cyan)]/40",
);

/** 与 Input 像素风格一致的分类下拉（原生 select） */
export const pixelSelectClassName = cn(
  "!rounded-none h-8 w-full min-w-0 border-4 border-[var(--pixel-border)] bg-transparent px-2.5 py-1",
  "font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-fg)]",
  "outline-none transition-colors",
  "focus-visible:ring-2 focus-visible:ring-[var(--pixel-cyan)]/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "md:text-sm",
);
