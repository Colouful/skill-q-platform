import { prisma } from "@/lib/prisma";
import {
  buildInstallManifest,
  buildScenarioManifest,
  normalizeManifestProfile,
  type ScenarioManifest,
} from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { toManifestRoleId, toManifestRoleIds, toManifestRuleIds, toManifestSkillIds } from "@/lib/manifest-registry-id";
import { CATALOG_PUBLISH_STATUS, stringArrayFromJson } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { buildAiSpecFirstInstallCommand, buildAiSpecSyncCommand } from "@/lib/ai-spec-cli";

export type InstallPreviewInput = {
  profile?: string;
  ides?: string[];
  scenario_packages?: string[];
  roles?: string[];
  skills?: string[];
  rules?: string[];
  customizeRoles?: boolean;
  customizeSkills?: boolean;
  customizeRules?: boolean;
};

export type InstallPreviewResult = {
  manifest: ScenarioManifest;
  warnings: string[];
  remoteManifestUrl: string | null;
  commands: {
    firstInstall: string;
    syncIncremental: string;
  };
};

function normalizeList(items: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (items ?? [])
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export async function buildInstallPreview(
  input: InstallPreviewInput,
  siteOrigin: string,
): Promise<InstallPreviewResult> {
  const scenarioSlugs = normalizeList(input.scenario_packages);
  const roleSlugs = normalizeList(input.roles);
  const skillSlugs = normalizeList(input.skills);
  const ruleSlugs = normalizeList(input.rules);
  const requestedIdes = normalizeList(input.ides);
  const useExplicitRoles = input.customizeRoles === true;
  const useExplicitSkills = input.customizeSkills === true;
  const useExplicitRules = input.customizeRules === true;
  const warnings: string[] = [];

  const [scenarios, directRoles, directSkills, directRules] = await Promise.all([
    prisma.scenarioPackage.findMany({
      where: {
        publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
        slug: { in: scenarioSlugs.length > 0 ? scenarioSlugs : ["__none__"] },
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
          include: { skill: true },
          orderBy: { sortOrder: "asc" },
        },
        rules: {
          where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          include: { rule: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.roleTemplate.findMany({
      where: {
        publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
        slug: { in: roleSlugs.length > 0 ? roleSlugs : ["__none__"] },
      },
    }),
    prisma.skill.findMany({
      where: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        slug: { in: skillSlugs.length > 0 ? skillSlugs : ["__none__"] },
      },
    }),
    prisma.rule.findMany({
      where: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        slug: { in: ruleSlugs.length > 0 ? ruleSlugs : ["__none__"] },
      },
    }),
  ]);

  const foundScenarioSlugs = new Set(scenarios.map((item) => item.slug));
  const foundRoleSlugs = new Set(directRoles.map((item) => item.slug));
  const foundSkillSlugs = new Set(directSkills.map((item) => item.slug));
  const foundRuleSlugs = new Set(directRules.map((item) => item.slug));

  scenarioSlugs.forEach((slug) => {
    if (!foundScenarioSlugs.has(slug)) warnings.push(`场景方案不存在或未发布：${slug}`);
  });
  roleSlugs.forEach((slug) => {
    if (!foundRoleSlugs.has(slug)) warnings.push(`专家不存在或未发布：${slug}`);
  });
  skillSlugs.forEach((slug) => {
    if (!foundSkillSlugs.has(slug)) warnings.push(`Skill 不存在或未发布：${slug}`);
  });
  ruleSlugs.forEach((slug) => {
    if (!foundRuleSlugs.has(slug)) warnings.push(`Rule 不存在或未发布：${slug}`);
  });

  const scenarioProfiles = scenarios.flatMap((scenario) => stringArrayFromJson(scenario.supportedProfiles));
  const directRoleProfiles = directRoles.flatMap((role) => stringArrayFromJson(role.supportedProfiles));
  const effectiveProfile = normalizeManifestProfile(
    input.profile?.trim() || scenarioProfiles[0] || directRoleProfiles[0] || "default",
  );

  const scenarioAvailableRoleSlugSet = new Set(
    scenarios.flatMap((scenario) =>
      resolveScenarioAssets(scenario, { profile: effectiveProfile }).availableRoleSlugs,
    ),
  );
  const explicitScenarioRoleSlugs = useExplicitRoles
    ? roleSlugs.filter((slug) => scenarioAvailableRoleSlugSet.has(slug))
    : [];
  const explicitExternalRoleSlugs = roleSlugs.filter((slug) => !scenarioAvailableRoleSlugSet.has(slug));
  const resolvedScenarioSelections = scenarios.map((scenario) =>
    resolveScenarioAssets(scenario, {
      profile: effectiveProfile,
      selectedRoleSlugs: useExplicitRoles ? explicitScenarioRoleSlugs : undefined,
    }),
  );

  const combinedRoleAssets = [
    ...resolvedScenarioSelections.flatMap((item) => item.roles),
    ...directRoles.filter((item) => explicitExternalRoleSlugs.includes(item.slug)),
  ];
  const combinedSkillAssets = useExplicitSkills
    ? directSkills
    : [...resolvedScenarioSelections.flatMap((item) => item.resolvedSkills), ...directSkills];
  const combinedRuleAssets = useExplicitRules
    ? directRules
    : [...resolvedScenarioSelections.flatMap((item) => item.resolvedRules), ...directRules];

  const scenarioIdes = scenarios.flatMap((scenario) => stringArrayFromJson(scenario.recommendedIdes));

  const manifest = buildInstallManifest({
    profile: effectiveProfile,
    ides: requestedIdes.length > 0 ? requestedIdes : scenarioIdes,
    scenarioPackages: scenarios.map((item) => item.slug),
    roles: toManifestRoleIds(combinedRoleAssets),
    skills: toManifestSkillIds(combinedSkillAssets),
    rules: toManifestRuleIds(combinedRuleAssets),
    entryRole:
      (() => {
        const entryRoleSlug = resolvedScenarioSelections.find((item) => item.entryRoleSlug)?.entryRoleSlug;
        if (entryRoleSlug) {
          const entryRole =
            combinedRoleAssets.find((role) => role.slug === entryRoleSlug) ?? { slug: entryRoleSlug };
          return toManifestRoleId(entryRole);
        }
        return combinedRoleAssets[0] ? toManifestRoleId(combinedRoleAssets[0]) : null;
      })() ??
      null,
  });

  if (!manifest.entry_role) {
    warnings.push("当前预览没有入口专家，安装后需手动补齐 entry_role。");
  }

  let remoteManifestUrl: string | null = null;
  if (scenarios.length === 1) {
    const baseScenario = scenarios[0]!;
    const baseResolved = resolveScenarioAssets(baseScenario, { profile: manifest.profile });
    const baseManifest = buildScenarioManifest({
      scenarioSlug: baseScenario.slug,
      profile: manifest.profile,
      recommendedIdes: baseScenario.recommendedIdes,
      entryRoleSlug: baseResolved.entryRoleSlug
        ? toManifestRoleId(baseResolved.roles.find((role) => role.slug === baseResolved.entryRoleSlug) ?? {
            slug: baseResolved.entryRoleSlug,
          })
        : null,
      roles: toManifestRoleIds(baseResolved.roles),
      skills: toManifestSkillIds(baseResolved.resolvedSkills),
      rules: toManifestRuleIds(baseResolved.resolvedRules),
    });

    const sameAsBase = JSON.stringify(baseManifest) === JSON.stringify(manifest);
    if (sameAsBase) {
      remoteManifestUrl = `${siteOrigin}/api/manifests/scenarios/${encodeURIComponent(baseScenario.slug)}?profile=${encodeURIComponent(manifest.profile)}`;
    }
  }

  const manifestRef = remoteManifestUrl ?? "./manifest.json";

  return {
    manifest,
    warnings,
    remoteManifestUrl,
    commands: {
      firstInstall: buildAiSpecFirstInstallCommand({
        profile: manifest.profile,
        ides: manifest.ides,
        manifestRef,
      }),
      syncIncremental: buildAiSpecSyncCommand({ manifestRef }),
    },
  };
}
