import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  CATALOG_PUBLISH_STATUS,
  catalogPublishStatusLabel,
  isPublishedCatalogStatus,
  stringArrayFromJson,
} from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { rolePath, rulePath, scenarioPath, skillPath } from "@/lib/slug-url";

export const dynamic = "force-dynamic";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = await prisma.roleTemplate.findUnique({
    where: { slug },
    include: {
      domainLinks: { include: { domain: true } },
      versions: { orderBy: { createdAt: "desc" } },
      skillLinks: {
        where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { skill: { include: { category: true } } },
      },
      ruleLinks: {
        where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { rule: { include: { category: true } } },
      },
      scenarioLinks: {
        where: { scenarioPackage: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { scenarioPackage: true },
      },
    },
  });

  if (!role || !isPublishedCatalogStatus(role.publishStatus)) {
    notFound();
  }

  const profiles = stringArrayFromJson(role.supportedProfiles);

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <div className="space-y-4 border-b-4 border-[var(--pixel-border)] pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
          <Link href="/roles" className="hover:text-[var(--pixel-fg)]">
            专家
          </Link>
          <span>/</span>
          <span>{role.name}</span>
        </div>

        <div className="space-y-3">
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-accent)]">
            专家详情
          </p>
          <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg leading-relaxed text-[var(--pixel-fg)]">
            {role.name}
          </h1>
          <p className="max-w-3xl font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-muted)]">
            {role.longDescription || role.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {role.domainLinks.map((item) => (
            <Badge key={item.domain.id} variant="outline" className="border-[var(--pixel-border)] bg-transparent">
              {item.domain.name}
            </Badge>
          ))}
          {profiles.map((profile) => (
            <Badge key={profile} variant="secondary" className="bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]">
              {profile}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              关联 Skill
            </h2>
            <div className="space-y-3">
              {role.skillLinks.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无已发布 Skill。
                </p>
              ) : (
                role.skillLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={skillPath(item.skill.slug)}
                    className="block border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]"
                  >
                    <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
                      {item.skill.category.name}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                      {item.skill.name}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                      {item.skill.description}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              附带 Rule
            </h2>
            <div className="space-y-3">
              {role.ruleLinks.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无已发布 Rule。
                </p>
              ) : (
                role.ruleLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={rulePath(item.rule.slug)}
                    className="block border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]"
                  >
                    <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
                      {item.rule.category.name}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                      {item.rule.name}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                      {item.rule.description}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              版本
            </h2>
            <div className="space-y-3">
              {role.versions.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无版本记录。
                </p>
              ) : (
                role.versions.map((version) => (
                  <a
                    key={version.id}
                    href={`/api/roles/${encodeURIComponent(role.slug)}/versions/${encodeURIComponent(version.version)}/download`}
                    className="block border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                        {version.version}
                      </p>
                      <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                        {version.isLatest ? "latest" : "history"}
                      </span>
                    </div>
                    <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                      {version.changelog || "无变更说明"}
                    </p>
                  </a>
                ))
              )}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              基本信息
            </h2>
            <dl className="mt-4 space-y-3 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
              <div className="flex items-center justify-between gap-4">
                <dt>作者</dt>
                <dd>{role.author}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>状态</dt>
                <dd>{catalogPublishStatusLabel(role.publishStatus)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>版本数</dt>
                <dd>{role.versions.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>推荐场景</dt>
                <dd>{role.scenarioLinks.length}</dd>
              </div>
            </dl>
          </section>

          <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              安装入口
            </h2>
            <p className="mt-3 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
              使用推荐场景进入项目接入页，再按需微调 Skill / Rule 清单。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={
                  role.scenarioLinks[0]
                    ? `/install?scenario=${encodeURIComponent(role.scenarioLinks[0].scenarioPackage.slug)}&roles=${encodeURIComponent(role.slug)}`
                    : "/install"
                }
                className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]"
              >
                打开项目接入
              </Link>
            </div>
          </section>

          <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              推荐场景方案
            </h2>
            <div className="mt-4 space-y-3">
              {role.scenarioLinks.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无推荐场景方案。
                </p>
              ) : (
                role.scenarioLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={scenarioPath(item.scenarioPackage.slug)}
                    className="block border-2 border-[var(--pixel-border)] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)] hover:bg-[var(--pixel-cyan)]/10"
                  >
                    {item.scenarioPackage.name}
                  </Link>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
