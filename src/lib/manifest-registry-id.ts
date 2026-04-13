import { inferRuleRegistryId, inferSkillRegistryId } from "@/lib/br-ai-spec-export";
import { getHubProfileIds, readStoredSupportedProfiles } from "@/lib/profile-options";

type ManifestAssetLike = {
  slug: string;
  name?: string | null;
  supportedProfiles?: unknown;
};

function uniquePreserved(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function resolveAssetProfiles(asset: ManifestAssetLike): string[] {
  return readStoredSupportedProfiles(asset.supportedProfiles).profiles;
}

export function toManifestSkillId(skill: ManifestAssetLike): string {
  return inferSkillRegistryId({
    hubSlug: skill.slug,
    hubName: skill.name?.trim() || skill.slug,
    profiles: resolveAssetProfiles(skill),
    knownProfiles: getHubProfileIds(),
  });
}

export function toManifestRuleId(rule: ManifestAssetLike): string {
  return inferRuleRegistryId({
    hubSlug: rule.slug,
    hubName: rule.name?.trim() || rule.slug,
    profiles: resolveAssetProfiles(rule),
    knownProfiles: getHubProfileIds(),
  });
}

export function toManifestSkillIds(skills: ManifestAssetLike[]): string[] {
  return uniquePreserved(skills.map((item) => toManifestSkillId(item)));
}

export function toManifestRuleIds(rules: ManifestAssetLike[]): string[] {
  return uniquePreserved(rules.map((item) => toManifestRuleId(item)));
}
