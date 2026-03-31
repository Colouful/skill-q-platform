import { prisma } from "@/lib/prisma";
import { buildInstallManifest, buildScenarioManifest, type ScenarioManifest } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { CATALOG_PUBLISH_STATUS, stringArrayFromJson } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { buildAiSpecInitCommand, buildAiSpecSyncCommand } from "@/lib/ai-spec-cli";

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
    init: string;
    syncRemote: string;
    syncLocal: string;
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

  const scenarioAvailableRoleSlugSet = new Set(
    scenarios.flatMap((scenario) => resolveScenarioAssets(scenario).availableRoleSlugs),
  );
  const explicitScenarioRoleSlugs = useExplicitRoles
    ? roleSlugs.filter((slug) => scenarioAvailableRoleSlugSet.has(slug))
    : [];
  const explicitExternalRoleSlugs = roleSlugs.filter((slug) => !scenarioAvailableRoleSlugSet.has(slug));
  const resolvedScenarioSelections = scenarios.map((scenario) =>
    resolveScenarioAssets(scenario, {
      selectedRoleSlugs: useExplicitRoles ? explicitScenarioRoleSlugs : undefined,
    }),
  );

  const scenarioRoleSlugs = resolvedScenarioSelections.flatMap((item) => item.roleSlugs);
  const scenarioSkillDefaults = resolvedScenarioSelections.flatMap((item) => item.skillSlugs);
  const scenarioRuleDefaults = resolvedScenarioSelections.flatMap((item) => item.ruleSlugs);
  const combinedRoleSlugs = [
    ...scenarioRoleSlugs,
    ...directRoles
      .map((item) => item.slug)
      .filter((slug) => explicitExternalRoleSlugs.includes(slug)),
  ];
  const combinedSkillSlugs = useExplicitSkills ? skillSlugs : scenarioSkillDefaults;
  const combinedRuleSlugs = useExplicitRules ? ruleSlugs : scenarioRuleDefaults;

  const scenarioProfiles = scenarios.flatMap((scenario) => stringArrayFromJson(scenario.supportedProfiles));
  const scenarioIdes = scenarios.flatMap((scenario) => stringArrayFromJson(scenario.recommendedIdes));
  const directRoleProfiles = directRoles.flatMap((role) => stringArrayFromJson(role.supportedProfiles));

  const manifest = buildInstallManifest({
    profile: input.profile?.trim() || scenarioProfiles[0] || directRoleProfiles[0] || "default",
    ides: requestedIdes.length > 0 ? requestedIdes : scenarioIdes,
    scenarioPackages: scenarios.map((item) => item.slug),
    roles: combinedRoleSlugs,
    skills: [...combinedSkillSlugs, ...directSkills.map((item) => item.slug)],
    rules: [...combinedRuleSlugs, ...directRules.map((item) => item.slug)],
    entryRole:
      resolvedScenarioSelections.find((item) => item.entryRoleSlug)?.entryRoleSlug ??
      combinedRoleSlugs[0] ??
      null,
  });

  if (!manifest.entry_role) {
    warnings.push("当前预览没有入口专家，安装后需手动补齐 entry_role。");
  }

  let remoteManifestUrl: string | null = null;
  if (scenarios.length === 1) {
    const baseScenario = scenarios[0]!;
    const baseResolved = resolveScenarioAssets(baseScenario);
    const baseManifest = buildScenarioManifest({
      scenarioSlug: baseScenario.slug,
      supportedProfiles: baseScenario.supportedProfiles,
      recommendedIdes: baseScenario.recommendedIdes,
      entryRoleSlug: baseResolved.entryRoleSlug,
      roles: baseResolved.roleSlugs,
      skills: baseResolved.skillSlugs,
      rules: baseResolved.ruleSlugs,
    });

    const sameAsBase =
      JSON.stringify(baseManifest) === JSON.stringify(manifest);
    if (sameAsBase) {
      remoteManifestUrl = `${siteOrigin}/api/manifests/scenarios/${encodeURIComponent(baseScenario.slug)}`;
    }
  }

  const manifestRef = remoteManifestUrl ?? "./manifest.json";
  const localManifestFilename =
    scenarios.length === 1 ? `${scenarios[0]!.slug}.manifest.json` : "ai-spec.manifest.json";

  return {
    manifest,
    warnings,
    remoteManifestUrl,
    commands: {
      init: buildAiSpecInitCommand({
        profile: manifest.profile,
        ides: manifest.ides,
      }),
      syncRemote: buildAiSpecSyncCommand({ manifestRef }),
      syncLocal: buildAiSpecSyncCommand({ manifestRef: `./${localManifestFilename}` }),
    },
  };
}
