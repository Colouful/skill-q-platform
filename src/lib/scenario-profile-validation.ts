import { prisma } from "@/lib/prisma";
import { readStoredSupportedProfiles } from "@/lib/profile-options";

type ScenarioProfileAssetKind = "入口专家" | "专家" | "Skill" | "Rule";

type ScenarioProfileAsset = {
  kind: ScenarioProfileAssetKind;
  slug: string;
  name?: string | null;
  supportedProfiles: string[];
};

function uniquePreserved(items: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const trimmed = item?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function hasIntersection(left: string[], right: string[]): boolean {
  if (left.length === 0 || right.length === 0) return true;
  const rightSet = new Set(right);
  return left.some((item) => rightSet.has(item));
}

function formatProfiles(profiles: string[]): string {
  return profiles.join(", ");
}

export function findScenarioProfileConflict(input: {
  scenarioProfiles: string[];
  assets: ScenarioProfileAsset[];
}): string | null {
  if (input.scenarioProfiles.length === 0) {
    return "场景 supportedProfiles 不能为空，请至少选择一个 profile。";
  }

  for (const asset of input.assets) {
    if (asset.supportedProfiles.length === 0) {
      continue;
    }
    if (hasIntersection(asset.supportedProfiles, input.scenarioProfiles)) {
      continue;
    }

    const label = asset.name?.trim() || asset.slug;
    return `${asset.kind}“${label}”的 supportedProfiles=[${formatProfiles(asset.supportedProfiles)}] 与场景 supportedProfiles=[${formatProfiles(input.scenarioProfiles)}] 不相交，请移除该资产或调整场景 profile。`;
  }

  return null;
}

export async function validateScenarioProfileSelection(input: {
  supportedProfiles: string[];
  entryRoleId?: string | null;
  roleIds: string[];
  skillIds: string[];
  ruleIds: string[];
}): Promise<string | null> {
  const scenarioProfiles = readStoredSupportedProfiles(input.supportedProfiles).profiles;
  if (scenarioProfiles.length === 0) {
    return "场景 supportedProfiles 不能为空，请至少选择一个 profile。";
  }

  const roleIds = uniquePreserved([...input.roleIds, input.entryRoleId ?? undefined]);
  const skillIds = uniquePreserved(input.skillIds);
  const ruleIds = uniquePreserved(input.ruleIds);

  const [roles, skills, rules] = await Promise.all([
    roleIds.length > 0
      ? prisma.roleTemplate.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, slug: true, name: true, supportedProfiles: true },
        })
      : Promise.resolve([]),
    skillIds.length > 0
      ? prisma.skill.findMany({
          where: { id: { in: skillIds } },
          select: { id: true, slug: true, name: true, supportedProfiles: true },
        })
      : Promise.resolve([]),
    ruleIds.length > 0
      ? prisma.rule.findMany({
          where: { id: { in: ruleIds } },
          select: { id: true, slug: true, name: true, supportedProfiles: true },
        })
      : Promise.resolve([]),
  ]);

  const assets: ScenarioProfileAsset[] = [
    ...roles.map((role) => ({
      kind: role.id === input.entryRoleId ? "入口专家" as const : "专家" as const,
      slug: role.slug,
      name: role.name,
      supportedProfiles: readStoredSupportedProfiles(role.supportedProfiles).profiles,
    })),
    ...skills.map((skill) => ({
      kind: "Skill" as const,
      slug: skill.slug,
      name: skill.name,
      supportedProfiles: readStoredSupportedProfiles(skill.supportedProfiles).profiles,
    })),
    ...rules.map((rule) => ({
      kind: "Rule" as const,
      slug: rule.slug,
      name: rule.name,
      supportedProfiles: readStoredSupportedProfiles(rule.supportedProfiles).profiles,
    })),
  ];

  return findScenarioProfileConflict({
    scenarioProfiles,
    assets,
  });
}
