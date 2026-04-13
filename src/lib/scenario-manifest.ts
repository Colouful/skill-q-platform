import { stringArrayFromJson } from "@/lib/catalog";

export type ScenarioManifest = {
  profile: string;
  ides: string[];
  scenario_packages: string[];
  roles: string[];
  skills: string[];
  rules: string[];
  entry_role: string | null;
};

const SUPPORTED_MANIFEST_IDES = new Set(["cursor", "claude", "opencode", "trae"]);

export function normalizeManifestProfile(profile?: string | null) {
  const cleaned = (profile ?? "").trim().toLowerCase();
  return cleaned || "default";
}

function normalizeManifestIdes(ides?: string[]) {
  const cleaned = (ides ?? [])
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item && SUPPORTED_MANIFEST_IDES.has(item));

  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : ["default"];
}

export function buildInstallManifest(input: {
  profile?: string | null;
  ides?: string[];
  scenarioPackages: string[];
  roles: string[];
  skills: string[];
  rules: string[];
  entryRole?: string | null;
}): ScenarioManifest {
  return {
    profile: normalizeManifestProfile(input.profile),
    ides: normalizeManifestIdes(input.ides),
    scenario_packages: Array.from(new Set(input.scenarioPackages)),
    roles: Array.from(new Set(input.roles)),
    skills: Array.from(new Set(input.skills)),
    rules: Array.from(new Set(input.rules)),
    entry_role: input.entryRole?.trim() || null,
  };
}

export function buildScenarioManifest(input: {
  scenarioSlug: string;
  profile?: string | null;
  supportedProfiles?: unknown;
  recommendedIdes?: unknown;
  entryRoleSlug?: string | null;
  roles: string[];
  skills: string[];
  rules: string[];
}): ScenarioManifest {
  const ides = stringArrayFromJson(input.recommendedIdes);
  const supportedProfiles = stringArrayFromJson(input.supportedProfiles);

  return buildInstallManifest({
    profile: input.profile ?? supportedProfiles[0] ?? "default",
    ides,
    scenarioPackages: [input.scenarioSlug],
    roles: input.roles,
    skills: input.skills,
    rules: input.rules,
    entryRole: input.entryRoleSlug ?? null,
  });
}
