import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { HomeHeroDecor } from "@/components/home/home-hero-decor";
import { ShrimpBallPixel } from "@/components/mascot/shrimp-ball-pixel";
import { SkillCard } from "@/components/skill/skill-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.skill.findMany({
    where: { isFeatured: true, moderationStatus: MODERATION_STATUS.PUBLISHED },
    take: 6,
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  const recent = await prisma.skill.findMany({
    where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
    take: 8,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-10 pb-8">
      <section className="border-b-4 border-[var(--pixel-border)] pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex max-w-xl items-start gap-3">
            <ShrimpBallPixel
              className="mt-0.5 border-2 border-[var(--pixel-border)] bg-[var(--card)] shadow-[3px_3px_0_0_var(--pixel-border)]"
              size={44}
              decorative
            />
            <p className="font-[family-name:var(--font-pixel-body)] text-base leading-relaxed text-[var(--pixel-muted)]">
              <span className="font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]">
                虾球Hub
              </span>
              ：Skill 与 Rule 的发现与分享，为 Agent 而设的像素风能力站。
            </p>
          </div>
          <HomeHeroDecor />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          推荐
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.length === 0 ? (
            <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
              暂无推荐，请先执行 prisma db seed
            </p>
          ) : (
            featured.map((s) => (
              <div key={s.id} className="skill-card-cv min-w-0">
                <SkillCard skill={s} />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          最新
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {recent.map((s) => (
            <div key={s.id} className="skill-card-cv min-w-0">
              <SkillCard skill={s} compact />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
