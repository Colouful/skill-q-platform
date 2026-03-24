"use client";

/** 首页 Hero 右侧：苹果风 — 磨砂玻璃 + 柔和弥散光斑 */
export function HomeHeroApple() {
  return (
    <div
      className="home-hero-apple relative h-[88px] w-full max-w-md shrink-0 overflow-hidden rounded-[var(--hub-radius-lg)] border border-[var(--pixel-border)]/35 bg-white/75 shadow-[var(--hub-shadow-card-skill)] backdrop-blur-md sm:h-[104px] sm:max-w-lg lg:max-w-xl"
      aria-hidden
    >
      <div className="home-hero-apple-blob home-hero-apple-blob--a pointer-events-none absolute -left-[12%] top-1/2 h-[140%] w-[45%] -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--pixel-cyan)_28%,transparent)] blur-2xl" />
      <div className="home-hero-apple-blob home-hero-apple-blob--b pointer-events-none absolute -right-[8%] -top-[20%] h-[120%] w-[42%] rounded-full bg-[color-mix(in_srgb,var(--pixel-accent)_22%,transparent)] blur-2xl" />
      <div className="home-hero-apple-blob home-hero-apple-blob--c pointer-events-none absolute bottom-[-30%] left-[28%] h-[70%] w-[55%] rounded-full bg-[color-mix(in_srgb,var(--pixel-yellow)_18%,transparent)] blur-2xl" />
      <div className="relative z-[1] flex h-full items-center justify-center px-4">
        <div className="h-px w-full max-w-[72%] rounded-full bg-gradient-to-r from-transparent via-[var(--pixel-border)]/25 to-transparent home-hero-apple-shine" />
      </div>
    </div>
  );
}
