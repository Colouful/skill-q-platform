import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { LobsterEmpty } from "@/components/lobster";
import { InstallPreviewClient } from "@/components/install/install-preview-client";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { AI_SPEC_PACKAGE_SPEC } from "@/lib/ai-spec-cli";

export const dynamic = "force-dynamic";

function splitCsvParam(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function InstallPage({
  searchParams,
}: {
  searchParams: Promise<{
    scenario?: string;
    role?: string;
    roles?: string;
    skills?: string;
    rules?: string;
    profile?: string;
    ides?: string;
  }>;
}) {
  const sp = await searchParams;

  const scenarios = await prisma.scenarioPackage.findMany({
    where: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED },
    include: {
      entryRole: {
        include: {
          skillLinks: {
            where: { skill: { moderationStatus: "published" } },
            orderBy: { sortOrder: "asc" },
            include: { skill: true },
          },
          ruleLinks: {
            where: { rule: { moderationStatus: "published" } },
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
                where: { skill: { moderationStatus: "published" } },
                orderBy: { sortOrder: "asc" },
                include: { skill: true },
              },
              ruleLinks: {
                where: { rule: { moderationStatus: "published" } },
                orderBy: { sortOrder: "asc" },
                include: { rule: true },
              },
            },
          },
        },
      },
      skills: {
        where: { skill: { moderationStatus: "published" } },
        orderBy: { sortOrder: "asc" },
        include: { skill: true },
      },
      rules: {
        where: { rule: { moderationStatus: "published" } },
        orderBy: { sortOrder: "asc" },
        include: { rule: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
  });

  const requestedRoleSlugs = Array.from(new Set([...splitCsvParam(sp.roles), ...splitCsvParam(sp.role)]));
  const requestedSkillSlugs = splitCsvParam(sp.skills);
  const requestedRuleSlugs = splitCsvParam(sp.rules);
  const requestedIdes = splitCsvParam(sp.ides);

  const selected =
    scenarios.find((item) => item.slug === sp.scenario) ??
    scenarios.find((item) =>
      requestedRoleSlugs.some((slug) => item.roles.some((role) => role.role.slug === slug)),
    ) ??
    scenarios[0] ??
    null;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <div className="space-y-2 border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          项目接入
        </h1>
        <p className="max-w-3xl font-[family-name:var(--font-pixel-body)] text-base text-[var(--pixel-muted)]">
          一期先提供按场景方案快捷接入：选择方案，读取 Manifest URL，然后交给{" "}
          <code className="font-mono text-[var(--pixel-fg)]">{AI_SPEC_PACKAGE_SPEC}</code>{" "}
          完成安装和本地结构编译。
        </p>
      </div>

      {scenarios.length === 0 || !selected ? (
        <div className="py-12">
          <LobsterEmpty message="还没有可接入的场景方案。" />
        </div>
      ) : (
        <InstallPreviewClient
          scenarios={scenarios.map((scenario) => {
            const resolved = resolveScenarioAssets(scenario);
            const roleSkillMap = Object.fromEntries(
              resolved.availableRoles.map((role) => [
                role.slug,
                Array.from(
                  new Map(
                    (role.skillLinks ?? []).map((link) => [
                      link.skill.slug,
                      { slug: link.skill.slug, name: link.skill.name },
                    ]),
                  ).values(),
                ),
              ]),
            );
            const roleRuleMap = Object.fromEntries(
              resolved.availableRoles.map((role) => [
                role.slug,
                Array.from(
                  new Map(
                    (role.ruleLinks ?? []).map((link) => [
                      link.rule.slug,
                      { slug: link.rule.slug, name: link.rule.name },
                    ]),
                  ).values(),
                ),
              ]),
            );

            return {
              slug: scenario.slug,
              name: scenario.name,
              description: scenario.description,
              isFeatured: scenario.isFeatured,
              supportedProfiles: Array.isArray(scenario.supportedProfiles)
                ? (scenario.supportedProfiles as string[])
                : [],
              recommendedIdes: Array.isArray(scenario.recommendedIdes)
                ? (scenario.recommendedIdes as string[])
                : [],
              entryRole: scenario.entryRole
                ? { name: scenario.entryRole.name, slug: scenario.entryRole.slug }
                : null,
              roles: resolved.availableRoles.map((item) => ({ slug: item.slug, name: item.name })),
              skills: resolved.resolvedSkills.map((item) => ({ slug: item.slug, name: item.name })),
              rules: resolved.resolvedRules.map((item) => ({ slug: item.slug, name: item.name })),
              directSkills: resolved.directSkills.map((item) => ({ slug: item.slug, name: item.name })),
              directRules: resolved.directRules.map((item) => ({ slug: item.slug, name: item.name })),
              roleSkillMap,
              roleRuleMap,
            };
          })}
          initialSelection={{
            scenarioSlug: selected.slug,
            profile: sp.profile ?? null,
            ides: requestedIdes,
            roles: requestedRoleSlugs,
            skills: requestedSkillSlugs,
            rules: requestedRuleSlugs,
            hasCustomProfile: typeof sp.profile === "string",
            hasCustomIdes: sp.ides !== undefined,
            hasCustomRoles: sp.roles !== undefined || sp.role !== undefined,
            hasCustomSkills: sp.skills !== undefined,
            hasCustomRules: sp.rules !== undefined,
          }}
        />
      )}
    </div>
  );
}
