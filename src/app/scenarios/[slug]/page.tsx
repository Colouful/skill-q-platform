import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MarkdownArticle } from "@/components/markdown/markdown-article";
import { buildScenarioManifest, normalizeManifestProfile } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { toManifestRuleIds, toManifestSkillIds } from "@/lib/manifest-registry-id";
import { CATALOG_PUBLISH_STATUS, isPublishedCatalogStatus, stringArrayFromJson } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { prisma } from "@/lib/prisma";
import { rolePath, rulePath, scenarioPath, skillPath } from "@/lib/slug-url";
import { stripLeadingFrontmatter } from "@/lib/markdown-frontmatter";
import {
  AI_SPEC_PACKAGE_SPEC,
  buildAiSpecFirstInstallCommand,
  buildAiSpecSyncCommand,
} from "@/lib/ai-spec-cli";

export const dynamic = "force-dynamic";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
}

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scenario = await prisma.scenarioPackage.findUnique({
    where: { slug },
    include: {
      entryRole: {
        include: {
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
        },
      },
      domainLinks: { include: { domain: true } },
      roles: {
        where: { role: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: {
          role: {
            include: {
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
            },
          },
        },
      },
      skills: {
        where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { skill: { include: { category: true } } },
      },
      rules: {
        where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { rule: { include: { category: true } } },
      },
    },
  });

  if (!scenario || !isPublishedCatalogStatus(scenario.publishStatus)) {
    notFound();
  }

  const profiles = stringArrayFromJson(scenario.supportedProfiles);
  const manifestProfile = normalizeManifestProfile(profiles[0] || "default");
  const resolved = resolveScenarioAssets(scenario);
  const manifestResolved = resolveScenarioAssets(scenario, { profile: manifestProfile });
  const manifest = buildScenarioManifest({
    scenarioSlug: scenario.slug,
    profile: manifestProfile,
    recommendedIdes: scenario.recommendedIdes,
    entryRoleSlug: manifestResolved.entryRoleSlug,
    roles: manifestResolved.roleSlugs,
    skills: toManifestSkillIds(manifestResolved.resolvedSkills),
    rules: toManifestRuleIds(manifestResolved.resolvedRules),
  });

  const ides = stringArrayFromJson(scenario.recommendedIdes);
  const longDescriptionMarkdown = stripLeadingFrontmatter(scenario.longDescription);
  const manifestUrl = `${siteOrigin()}/api/manifests/scenarios/${encodeURIComponent(scenario.slug)}?profile=${encodeURIComponent(manifest.profile)}`;
  const firstInstallCommand = buildAiSpecFirstInstallCommand({
    profile: manifest.profile,
    ides: manifest.ides,
    manifestRef: manifestUrl,
  });
  const syncCommand = buildAiSpecSyncCommand({ manifestRef: manifestUrl });

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <div className="space-y-4 border-b-4 border-[var(--pixel-border)] pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
          <Link href="/scenarios" className="hover:text-[var(--pixel-fg)]">
            场景方案
          </Link>
          <span>/</span>
          <span>{scenario.name}</span>
        </div>

        <div className="space-y-3">
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-accent)]">
            方案详情
          </p>
          <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg leading-relaxed text-[var(--pixel-fg)]">
            {scenario.name}
          </h1>
          <p className="max-w-3xl font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-muted)]">
            {scenario.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {scenario.domainLinks.map((item) => (
            <Badge key={item.domain.id} variant="outline" className="border-[var(--pixel-border)] bg-transparent">
              {item.domain.name}
            </Badge>
          ))}
          {profiles.map((profile) => (
            <Badge key={profile} variant="secondary" className="bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]">
              {profile}
            </Badge>
          ))}
          {ides.map((ide) => (
            <Badge key={ide} variant="outline" className="border-[var(--pixel-border)] bg-transparent">
              {ide}
            </Badge>
          ))}
        </div>
      </div>

      <section className="border-2 border-[var(--pixel-border)] bg-[#fffef8] px-4 py-3">
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          左侧展示的是场景全量结构；右侧 Manifest 预览是按 {manifest.profile} profile 生成的安装清单。
        </p>
      </section>

      {longDescriptionMarkdown ? (
        <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
          <details>
            <summary className="cursor-pointer list-none font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              查看完整模板说明
            </summary>
            <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              已隐藏 frontmatter，以下内容按 Markdown 结构展示。
            </p>
            <div className="mt-4 border-t-2 border-[var(--pixel-border)] pt-4">
              <MarkdownArticle content={longDescriptionMarkdown} />
            </div>
          </details>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1.1fr_0.9fr]">
        <section className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              推荐专家链
            </h2>
            <div className="space-y-3">
              {scenario.roles.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无已发布专家。
                </p>
              ) : (
                scenario.roles.map((item) => (
                  <Link
                    key={item.id}
                    href={rolePath(item.role.slug)}
                    className="block border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                        {item.role.name}
                      </p>
                      {item.isOptional ? (
                        <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                          可选
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                      {item.role.description}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              场景全量 Skill
            </h2>
            <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              这里展示专家链与场景补充项聚合后的全部 Skill，不按 profile 裁剪。
            </p>
            <div className="space-y-3">
              {resolved.resolvedSkills.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无已发布 Skill。
                </p>
              ) : (
                resolved.resolvedSkills.map((skill) => (
                  <Link
                    key={skill.slug}
                    href={skillPath(skill.slug)}
                    className="block border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-3"
                  >
                    {"category" in skill && skill.category ? (
                      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
                        {skill.category.name}
                      </p>
                    ) : null}
                    <p className="mt-1 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                      {skill.name}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              场景全量 Rule
            </h2>
            <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              这里展示专家链与场景补充项聚合后的全部 Rule，不按 profile 裁剪。
            </p>
            <div className="space-y-3">
              {resolved.resolvedRules.length === 0 ? (
                <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                  暂无已发布 Rule。
                </p>
              ) : (
                resolved.resolvedRules.map((rule) => (
                  <Link
                    key={rule.slug}
                    href={rulePath(rule.slug)}
                    className="block border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-3"
                  >
                    {"category" in rule && rule.category ? (
                      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
                        {rule.category.name}
                      </p>
                    ) : null}
                    <p className="mt-1 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                      {rule.name}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              场景结构摘要
            </h2>
            <dl className="mt-4 space-y-3 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
              <div className="flex items-center justify-between gap-4">
                <dt>入口专家</dt>
                <dd>{scenario.entryRole?.name ?? "未设置"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>专家数</dt>
                <dd>{scenario.roles.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Skill 数（全量）</dt>
                <dd>{resolved.resolvedSkills.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>Rule 数（全量）</dt>
                <dd>{resolved.resolvedRules.length}</dd>
              </div>
            </dl>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              安装 Manifest 预览
            </h2>
            <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              当前安装清单按 {manifest.profile} profile 生成，并会把同类资源归一化成安装用 ID。
            </p>
            <pre className="mt-4 overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </section>

          <section className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 shadow-[4px_4px_0_0_var(--pixel-border)]">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              安装命令
            </h2>
            <p className="mt-3 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
              当前 CLI 发布包：
              {" "}
              <code className="font-mono text-[var(--pixel-fg)]">{AI_SPEC_PACKAGE_SPEC}</code>
            </p>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                  10.1 首次接入（初始化 + 首次同步）
                </p>
                <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                  {firstInstallCommand}
                </pre>
              </div>
              <div className="space-y-2">
                <p className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
                  10.2 后续增量同步
                </p>
                <pre className="overflow-x-auto border-2 border-[var(--pixel-border)] bg-[#f7f0e0] p-3 font-mono text-xs text-[var(--pixel-fg)]">
                  {syncCommand}
                </pre>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/install?scenario=${encodeURIComponent(scenario.slug)}`}
                  className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]"
                >
                  打开项目接入
                </Link>
                <Link
                  href={`/api/manifests/scenarios/${encodeURIComponent(scenario.slug)}?profile=${encodeURIComponent(manifest.profile)}`}
                  className="inline-flex items-center justify-center border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]"
                >
                  打开 Manifest
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
