import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 虾球像素图 — 16×16 逻辑格，每格 2×2 映射到 viewBox 32×32（与 LobsterWalk 一致）
 */
const CELL = 2;

const PALETTE: Record<string, string> = {
  a: "#d4573a", // 虾须 / 暗部
  b: "#ff8a65", // 虾球主体
  w: "#fffef8", // 眼白
  k: "var(--pixel-border)", // 瞳孔（随主题描边色）
  t: "#e86d4d", // 虾尾
};

const ROWS = [
  "................",
  "................",
  "......aa..aa....",
  ".....aabbaabb...",
  "....aabbbbbbb...",
  "...aabbbbbbbbb..",
  "..aabbbbbbbbbbb.",
  ".aabbbbbbbbbbbb.",
  "aabbbwwwwwwbbbbb",
  "aabbbwk..kwbbbbb",
  "aabbbbbbbbbbbbbb",
  ".aabbbbbbbbbbbb.",
  "..aabbbbbbbbbbb.",
  "...aabbbbbbbbb..",
  "....aattaaaaaa..",
  ".....tttttttt...",
];

function ShrimpBallPixelCells() {
  const nodes: ReactNode[] = [];
  ROWS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "." || !PALETTE[ch]) return;
      nodes.push(
        <rect
          key={`${x}-${y}-${ch}`}
          x={x * CELL}
          y={y * CELL}
          width={CELL}
          height={CELL}
          fill={PALETTE[ch]}
        />,
      );
    });
  });
  return <>{nodes}</>;
}

export type ShrimpBallPixelProps = {
  className?: string;
  /** 默认与 LobsterWalk 一致 32 CSS px */
  size?: number | string;
  /** 装饰用：隐藏于无障碍树，不读 title */
  decorative?: boolean;
  title?: string;
};

/** 虾球品牌像素立绘（静态） */
export function ShrimpBallPixel({
  className,
  size = 32,
  decorative = false,
  title = "虾球",
}: ShrimpBallPixelProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 32 32"
      width={dim}
      height={dim}
      className={cn("shrink-0 text-[var(--pixel-fg)]", className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <ShrimpBallPixelCells />
    </svg>
  );
}
