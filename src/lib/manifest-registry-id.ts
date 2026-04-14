import { inferRuleRegistryId, inferSkillRegistryId } from "@/lib/br-ai-spec-export";
import {
  LEGACY_RULE_ID_ALIASES,
  LEGACY_SKILL_ID_ALIASES,
  normalizeRegistryLikeId,
} from "@/lib/hub-registry-contract";
import { getHubProfileIds, readStoredSupportedProfiles } from "@/lib/profile-options";

type ManifestAssetLike = {
  slug: string;
  name?: string | null;
  supportedProfiles?: unknown;
  registryId?: string | null;
  manifestId?: string | null;
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
  const explicitManifestId = normalizeRegistryLikeId(skill.manifestId);
  if (explicitManifestId) return explicitManifestId;
  const explicitRegistryId = normalizeRegistryLikeId(skill.registryId);
  if (explicitRegistryId) return explicitRegistryId;
  const directAlias = LEGACY_SKILL_ID_ALIASES[skill.slug.trim()];
  if (directAlias) return directAlias;
  return inferSkillRegistryId({
    hubSlug: skill.slug,
    hubName: skill.name?.trim() || skill.slug,
    profiles: resolveAssetProfiles(skill),
    knownProfiles: getHubProfileIds(),
  });
}

export function toManifestRuleId(rule: ManifestAssetLike): string {
  const explicitManifestId = normalizeRegistryLikeId(rule.manifestId);
  if (explicitManifestId) return explicitManifestId;
  const explicitRegistryId = normalizeRegistryLikeId(rule.registryId);
  if (explicitRegistryId) return explicitRegistryId;
  const directAlias = LEGACY_RULE_ID_ALIASES[rule.slug.trim()];
  if (directAlias) return directAlias;
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

export function toManifestRoleId(role: ManifestAssetLike): string {
  const explicitManifestId = normalizeRegistryLikeId(role.manifestId);
  if (explicitManifestId) return explicitManifestId;
  const explicitRegistryId = normalizeRegistryLikeId(role.registryId);
  if (explicitRegistryId) return explicitRegistryId;
  return role.slug.trim();
}

export function toManifestRoleIds(roles: ManifestAssetLike[]): string[] {
  return uniquePreserved(roles.map((item) => toManifestRoleId(item)));
}
