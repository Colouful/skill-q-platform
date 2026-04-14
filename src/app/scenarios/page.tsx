import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { LobsterEmpty } from "@/components/lobster";
import { MODERATION_STATUS } from "@/lib/moderation";
import { resolveScenarioAssets } from "@/lib/scenario-assets";

export const dynamic = "force-dynamic";

export default async function ScenariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const scenarios = await prisma.scenarioPackage.findMany({
    where: {
      publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : {}),
    },
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
  });
  const scenarioCards = scenarios.map((scenario) => {
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
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <div className="space-y-2 border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          场景方案
        </h1>
        <p className="max-w-3xl font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-muted)]">
          从场景方案进入安装链路，先选整体能力包，再查看专家、Skill 与 Rule 的组合关系。
        </p>
        <p className="max-w-3xl font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          场景统计为全量资源数，安装 manifest 会按 profile 归一化后收敛。
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="py-12">
          <LobsterEmpty message={q ? "没有匹配的场景方案" : "还没有已发布的场景方案。"} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {scenarioCards.map((scenario) => (
            <div key={scenario.id} className="min-w-0">
              <ScenarioCard scenario={scenario} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
