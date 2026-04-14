import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import {
  toManifestRoleId,
  toManifestRuleId,
  toManifestSkillId,
} from "@/lib/manifest-registry-id";

export type SupplementExportInput = {
  profile?: string;
  ides?: string[];
  roles?: string[];
  skills?: string[];
  rules?: string[];
};

export type SupplementExportSelection = {
  roles: string[];
  skills: string[];
  rules: string[];
  missing: {
    roles: string[];
    skills: string[];
    rules: string[];
  };
};

type CanonicalAssetLike = {
  slug: string;
  registryId?: string | null;
  manifestId?: string | null;
};

function normalizeRequestedIds(items: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (items ?? [])
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function buildSupplementSlugResolver<T extends CanonicalAssetLike>(
  assets: T[],
  canonicalResolver: (asset: T) => string,
) {
  const byManifestId = new Map<string, T>();
  const byRegistryId = new Map<string, T>();
  const byCanonicalId = new Map<string, T>();
  const bySlug = new Map<string, T>();

  for (const asset of assets) {
    const manifestId = asset.manifestId?.trim();
    if (manifestId && !byManifestId.has(manifestId)) {
      byManifestId.set(manifestId, asset);
    }

    const registryId = asset.registryId?.trim();
    if (registryId && !byRegistryId.has(registryId)) {
      byRegistryId.set(registryId, asset);
    }

    const canonicalId = canonicalResolver(asset).trim();
    if (canonicalId && !byCanonicalId.has(canonicalId)) {
      byCanonicalId.set(canonicalId, asset);
    }

    const slug = asset.slug.trim();
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, asset);
    }
  }

  return (requestedId: string): T | null => {
    const normalized = requestedId.trim();
    if (!normalized) return null;
    return (
      byManifestId.get(normalized) ??
      byRegistryId.get(normalized) ??
      byCanonicalId.get(normalized) ??
      bySlug.get(normalized) ??
      null
    );
  };
}

export function resolveRequestedCanonicalSlugs<T extends CanonicalAssetLike>(
  requestedIds: string[],
  resolveAsset: (requestedId: string) => T | null,
): { slugs: string[]; missing: string[] } {
  const slugs: string[] = [];
  const missing: string[] = [];

  for (const requestedId of requestedIds) {
    const asset = resolveAsset(requestedId);
    if (!asset) {
      missing.push(requestedId);
      continue;
    }
    if (!slugs.includes(asset.slug)) {
      slugs.push(asset.slug);
    }
  }

  return { slugs, missing };
}

export async function resolveSupplementExportSelection(
  input: SupplementExportInput,
): Promise<SupplementExportSelection> {
  const requestedRoleIds = normalizeRequestedIds(input.roles);
  const requestedSkillIds = normalizeRequestedIds(input.skills);
  const requestedRuleIds = normalizeRequestedIds(input.rules);

  const [roles, skills, rules] = await Promise.all([
    prisma.roleTemplate.findMany({
      where: {
        publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
        OR: [
          { manifestId: { in: requestedRoleIds.length > 0 ? requestedRoleIds : ["__none__"] } },
          { registryId: { in: requestedRoleIds.length > 0 ? requestedRoleIds : ["__none__"] } },
          { slug: { in: requestedRoleIds.length > 0 ? requestedRoleIds : ["__none__"] } },
        ],
      },
      select: {
        slug: true,
        registryId: true,
        manifestId: true,
      },
    }),
    prisma.skill.findMany({
      where: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        OR: [
          { manifestId: { in: requestedSkillIds.length > 0 ? requestedSkillIds : ["__none__"] } },
          { registryId: { in: requestedSkillIds.length > 0 ? requestedSkillIds : ["__none__"] } },
          { slug: { in: requestedSkillIds.length > 0 ? requestedSkillIds : ["__none__"] } },
        ],
      },
      select: {
        slug: true,
        name: true,
        supportedProfiles: true,
        registryId: true,
        manifestId: true,
      },
    }),
    prisma.rule.findMany({
      where: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        OR: [
          { manifestId: { in: requestedRuleIds.length > 0 ? requestedRuleIds : ["__none__"] } },
          { registryId: { in: requestedRuleIds.length > 0 ? requestedRuleIds : ["__none__"] } },
          { slug: { in: requestedRuleIds.length > 0 ? requestedRuleIds : ["__none__"] } },
        ],
      },
      select: {
        slug: true,
        name: true,
        supportedProfiles: true,
        registryId: true,
        manifestId: true,
      },
    }),
  ]);

  const resolveRole = buildSupplementSlugResolver(roles, toManifestRoleId);
  const resolveSkill = buildSupplementSlugResolver(skills, toManifestSkillId);
  const resolveRule = buildSupplementSlugResolver(rules, toManifestRuleId);

  const resolvedRoles = resolveRequestedCanonicalSlugs(requestedRoleIds, resolveRole);
  const resolvedSkills = resolveRequestedCanonicalSlugs(requestedSkillIds, resolveSkill);
  const resolvedRules = resolveRequestedCanonicalSlugs(requestedRuleIds, resolveRule);

  return {
    roles: resolvedRoles.slugs,
    skills: resolvedSkills.slugs,
    rules: resolvedRules.slugs,
    missing: {
      roles: resolvedRoles.missing,
      skills: resolvedSkills.missing,
      rules: resolvedRules.missing,
    },
  };
}
