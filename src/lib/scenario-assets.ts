import { stringArrayFromJson } from "@/lib/catalog";

type SlugAsset = {
  slug: string;
  supportedProfiles?: unknown;
};

type RoleAsset<
  TSkill extends SlugAsset = SlugAsset,
  TRule extends SlugAsset = SlugAsset,
> = SlugAsset & {
  skillLinks?: Array<{ skill: TSkill }>;
  ruleLinks?: Array<{ rule: TRule }>;
};

type ScenarioAssetInput<
  TSkill extends SlugAsset = SlugAsset,
  TRule extends SlugAsset = SlugAsset,
  TRole extends RoleAsset<TSkill, TRule> = RoleAsset<TSkill, TRule>,
> = {
  entryRole?: TRole | null;
  roles: Array<{ role: TRole }>;
  skills: Array<{ skill: TSkill }>;
  rules: Array<{ rule: TRule }>;
};

type ResolveScenarioAssetsOptions = {
  selectedRoleSlugs?: string[];
  profile?: string | null;
};

function uniqueBySlug<T extends SlugAsset>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item?.slug || seen.has(item.slug)) continue;
    seen.add(item.slug);
    result.push(item);
  }
  return result;
}

function normalizeScenarioProfile(profile?: string | null): string {
  const cleaned = (profile ?? "").trim().toLowerCase();
  return cleaned || "default";
}

function matchesProfileToken(candidate: string, profile: string): boolean {
  const normalizedCandidate = candidate.trim().toLowerCase();
  if (!normalizedCandidate) return false;
  if (normalizedCandidate === profile) return true;
  if (normalizedCandidate === "common" || normalizedCandidate === "shared" || normalizedCandidate === "all") {
    return true;
  }
  if (normalizedCandidate === `${profile}.common`) return true;
  if (normalizedCandidate === `${profile}.shared`) return true;
  return false;
}

function matchesProfile(item: { supportedProfiles?: unknown } | null | undefined, profile: string): boolean {
  if (!item) return false;
  if (!profile || profile === "default") return true;

  const supportedProfiles = stringArrayFromJson(item.supportedProfiles)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return supportedProfiles.length === 0 || supportedProfiles.some((candidate) => matchesProfileToken(candidate, profile));
}

export function resolveScenarioAssets<
  TSkill extends SlugAsset = SlugAsset,
  TRule extends SlugAsset = SlugAsset,
  TRole extends RoleAsset<TSkill, TRule> = RoleAsset<TSkill, TRule>,
>(
  input: ScenarioAssetInput<TSkill, TRule, TRole>,
  options?: ResolveScenarioAssetsOptions,
) {
  const effectiveProfile = normalizeScenarioProfile(options?.profile);
  const orderedAvailableRoles = uniqueBySlug([
    ...input.roles.map((item) => item.role),
    ...(input.entryRole ? [input.entryRole] : []),
  ]).filter((item) => matchesProfile(item, effectiveProfile));
  const availableRoleSlugSet = new Set(orderedAvailableRoles.map((item) => item.slug));
  const hasSelectedRoleOverride = Array.isArray(options?.selectedRoleSlugs);
  const selectedRoleSlugSet = hasSelectedRoleOverride
    ? new Set((options?.selectedRoleSlugs ?? []).filter((slug) => availableRoleSlugSet.has(slug)))
    : null;

  const effectiveRoles = selectedRoleSlugSet
    ? orderedAvailableRoles.filter((item) => selectedRoleSlugSet.has(item.slug))
    : orderedAvailableRoles;

  const directSkills = uniqueBySlug(
    input.skills
      .map((item) => item.skill)
      .filter((item) => matchesProfile(item, effectiveProfile)),
  );
  const directRules = uniqueBySlug(
    input.rules
      .map((item) => item.rule)
      .filter((item) => matchesProfile(item, effectiveProfile)),
  );
  const derivedSkills = uniqueBySlug(
    effectiveRoles.flatMap((role) =>
      (role.skillLinks?.map((link) => link.skill) ?? []).filter((item) =>
        matchesProfile(item, effectiveProfile),
      ),
    ),
  );
  const derivedRules = uniqueBySlug(
    effectiveRoles.flatMap((role) =>
      (role.ruleLinks?.map((link) => link.rule) ?? []).filter((item) =>
        matchesProfile(item, effectiveProfile),
      ),
    ),
  );
  const resolvedSkills = uniqueBySlug([...derivedSkills, ...directSkills]);
  const resolvedRules = uniqueBySlug([...derivedRules, ...directRules]);

  const entryRoleIncluded = input.entryRole?.slug
    ? effectiveRoles.some((item) => item.slug === input.entryRole?.slug)
    : false;

  return {
    availableRoles: orderedAvailableRoles,
    availableRoleSlugs: orderedAvailableRoles.map((item) => item.slug),
    roles: effectiveRoles,
    roleSlugs: effectiveRoles.map((item) => item.slug),
    directSkills,
    directRules,
    derivedSkills,
    derivedRules,
    resolvedSkills,
    resolvedRules,
    skillSlugs: resolvedSkills.map((item) => item.slug),
    ruleSlugs: resolvedRules.map((item) => item.slug),
    entryRoleSlug:
      entryRoleIncluded && input.entryRole?.slug
        ? input.entryRole.slug
        : effectiveRoles[0]?.slug ?? null,
  };
}
