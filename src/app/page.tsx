import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { HomeHeroDecor } from "@/components/home/home-hero-decor";
import { ShrimpBallPixel } from "@/components/mascot/shrimp-ball-pixel";
import { SkillCard } from "@/components/skill/skill-card";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import Link from "next/link";
import { AI_SPEC_PACKAGE_SPEC } from "@/lib/ai-spec-cli";
import { resolveScenarioAssets } from "@/lib/scenario-assets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, recent, featuredScenarios] = await Promise.all([
    prisma.skill.findMany({
      where: { isFeatured: true, moderationStatus: MODERATION_STATUS.PUBLISHED },
      take: 6,
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.skill.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      take: 8,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scenarioPackage.findMany({
      where: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED, isFeatured: true },
      take: 3,
      include: {
        entryRole: {
          include: {
            skillLinks: {
              where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
              orderBy: { sortOrder: "asc" },
              include: { skill: true },
            },
            ruleLinks: {
              where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
              orderBy: { sortOrder: "asc" },
              include: { rule: true },
            },
          },
        },
        roles: {
          where: { role: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: {
            role: {
              include: {
                skillLinks: {
                  where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
                  orderBy: { sortOrder: "asc" },
                  include: { skill: true },
                },
                ruleLinks: {
                  where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
                  orderBy: { sortOrder: "asc" },
                  include: { rule: true },
                },
              },
            },
          },
        },
        skills: {
          where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { skill: true },
        },
        rules: {
          where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { rule: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    }),
  ]);
  const featuredScenarioCards = featuredScenarios.map((scenario) => {
    const resolved = resolveScenarioAssets(scenario);
    return {
      id: scenario.id,
      slug: scenario.slug,
      name: scenario.name,
      description: scenario.description,
      isFeatured: scenario.isFeatured,
      supportedProfiles: scenario.supportedProfiles,
      recommendedIdes: scenario.recommendedIdes,
      entryRole: scenario.entryRole ? { name: scenario.entryRole.name } : null,
      roleCount: scenario.roles.length,
      skillCount: resolved.resolvedSkills.length,
      ruleCount: resolved.resolvedRules.length,
    };
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

      <section className="space-y-4 border-t-4 border-[var(--pixel-border)] pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            场景方案推荐
          </h2>
          <Link
            href="/scenarios"
            className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] underline"
          >
            查看全部
          </Link>
        </div>
        {featuredScenarios.length === 0 ? (
          <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
            还没有已发布的场景方案。
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {featuredScenarioCards.map((scenario) => (
              <div key={scenario.id} className="min-w-0">
                <ScenarioCard scenario={scenario} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-5 shadow-[4px_4px_0_0_var(--pixel-border)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              项目接入入口
            </p>
            <p className="max-w-2xl font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-muted)]">
              按场景方案生成安装清单，再用{" "}
              <code className="font-mono text-[var(--pixel-fg)]">{`npx ${AI_SPEC_PACKAGE_SPEC} init`}</code>{" "}
              安装到目标项目。一期先提供场景快捷接入，不影响现有 Skill / Rule 入口。
            </p>
          </div>
          <Link
            href="/install"
            className="inline-flex w-fit items-center justify-center border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-4 py-2 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)] shadow-[4px_4px_0_0_var(--pixel-border)] transition hover:-translate-y-px"
          >
            打开项目接入
          </Link>
        </div>
      </section>
    </div>
  );
}
