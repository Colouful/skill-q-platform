import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { RoleCard } from "@/components/roles/role-card";
import { LobsterEmpty } from "@/components/lobster";

export const dynamic = "force-dynamic";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();

  const roles = await prisma.roleTemplate.findMany({
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
      domainLinks: { include: { domain: true } },
      skillLinks: { select: { id: true } },
      ruleLinks: { select: { id: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <div className="space-y-2 border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          专家
        </h1>
        <p className="max-w-3xl font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-muted)]">
          专家用于承接场景方案中的职责分工，向下组合 Skill 与 Rule。一期只新增专家目录，不影响原有 Skill / Rule 浏览入口。
        </p>
      </div>

      {roles.length === 0 ? (
        <div className="py-12">
          <LobsterEmpty message={q ? "没有匹配的专家" : "还没有已发布的专家。"} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roles.map((role) => (
            <div key={role.id} className="min-w-0">
              <RoleCard role={role} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
