import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { ScenarioCard } from "@/components/scenarios/scenario-card";
import { LobsterEmpty } from "@/components/lobster";

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
      entryRole: { select: { name: true } },
      roles: { select: { id: true } },
      skills: { select: { id: true } },
      rules: { select: { id: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
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
      </div>

      {scenarios.length === 0 ? (
        <div className="py-12">
          <LobsterEmpty message={q ? "没有匹配的场景方案" : "还没有已发布的场景方案。"} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="min-w-0">
              <ScenarioCard scenario={scenario} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
