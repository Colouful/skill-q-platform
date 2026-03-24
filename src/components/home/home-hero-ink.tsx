"use client";

/** 首页 Hero 右侧：素描风 — 纸纹 + 斜线网 + 轻描扫描线 */
export function HomeHeroInk() {
  return (
    <div
      className="home-hero-ink relative h-[88px] w-full max-w-md shrink-0 overflow-hidden rounded-[var(--hub-radius-md)] border border-[var(--pixel-border)]/55 bg-[var(--pixel-bg)] shadow-[var(--hub-shadow-card-skill)] sm:h-[104px] sm:max-w-lg lg:max-w-xl"
      aria-hidden
    >
      <div className="home-hero-ink-paper pointer-events-none absolute inset-0 opacity-[0.35]" />
      <div className="home-hero-ink-hatch pointer-events-none absolute inset-0 opacity-[0.22]" />
      <div className="home-hero-ink-sweep pointer-events-none absolute inset-y-0 left-0 w-[28%]" />
      <div className="relative z-[1] flex h-full items-center justify-center px-6">
        <div className="h-[2px] w-full max-w-[85%] rounded-sm bg-[var(--pixel-border)]/20 home-hero-ink-line" />
      </div>
    </div>
  );
}
