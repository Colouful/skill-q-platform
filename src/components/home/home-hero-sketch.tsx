"use client";

/** 首页 Hero 右侧：手绘风 — 色块 + 星形点缀，轻微摆动 */
export function HomeHeroSketch() {
  return (
    <div
      className="home-hero-sketch relative h-[88px] w-full max-w-md shrink-0 overflow-hidden rounded-[var(--hub-radius-md)] border-[3px] border-dashed border-[var(--pixel-border)] bg-[#fff9ec] shadow-[var(--hub-shadow-card-skill)] sm:h-[104px] sm:max-w-lg lg:max-w-xl"
      aria-hidden
    >
      <div className="home-hero-sketch-blob absolute left-[8%] top-[18%] h-[42%] w-[22%] rounded-lg border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/90" />
      <div className="home-hero-sketch-blob absolute right-[12%] top-[22%] h-[38%] w-[26%] rotate-6 rounded-full border-2 border-[var(--pixel-border)] bg-[color-mix(in_srgb,var(--pixel-cyan)_35%,white)]" />
      <div className="home-hero-sketch-blob absolute bottom-[14%] left-[32%] h-[32%] w-[28%] -rotate-3 rounded-md border-2 border-[var(--pixel-border)] bg-[color-mix(in_srgb,var(--pixel-accent)_25%,white)]" />
      <span className="home-hero-sketch-star absolute right-[18%] top-[12%] text-lg leading-none text-[var(--pixel-accent)]">
        ✦
      </span>
      <span className="home-hero-sketch-star absolute bottom-[18%] right-[28%] text-sm leading-none text-[var(--pixel-cyan)]">
        ✧
      </span>
      <span className="home-hero-sketch-star absolute left-[42%] top-[8%] text-xs leading-none text-[var(--pixel-border)]">
        +
      </span>
    </div>
  );
}
