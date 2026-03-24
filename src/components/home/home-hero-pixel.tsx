"use client";

import type { ReactElement } from "react";

const COLS = 20;
const ROWS = 2;
const COLORS = [
  "var(--pixel-cyan)",
  "var(--pixel-yellow)",
  "var(--pixel-accent)",
] as const;

/** 首页 Hero 右侧：像素格追逐灯（与虾球像素风一致） */
export function HomeHeroPixel() {
  const cells: ReactElement[] = [];
  const total = COLS * ROWS;
  for (let i = 0; i < total; i++) {
    cells.push(
      <div
        key={i}
        className="home-hero-pixel-cell aspect-square min-h-[10px] w-full border-2 border-[var(--pixel-border)]"
        style={{
          backgroundColor: COLORS[i % COLORS.length],
          animationDelay: `${(i * 1.2) / total}s`,
        }}
      />,
    );
  }

  return (
    <div
      className="w-full max-w-md shrink-0 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-2 shadow-[var(--hub-shadow-card-skill)] sm:max-w-lg lg:max-w-xl"
      aria-hidden
    >
      <div
        className="grid w-full gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
