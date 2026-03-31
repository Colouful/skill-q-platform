export const HUB_PROFILE_OPTIONS = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
] as const;

export type HubProfileId = (typeof HUB_PROFILE_OPTIONS)[number]["id"];

const HUB_PROFILE_ID_SET = new Set<string>(HUB_PROFILE_OPTIONS.map((item) => item.id));

function uniquePreserved(items: Iterable<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function getHubProfileIds(): string[] {
  return HUB_PROFILE_OPTIONS.map((item) => item.id);
}

export function getHubProfileLabel(profileId: string): string {
  const matched = HUB_PROFILE_OPTIONS.find((item) => item.id === profileId);
  if (matched) return matched.label;
  if (!profileId) return "Profile";
  return profileId.charAt(0).toUpperCase() + profileId.slice(1);
}

export function isSupportedHubProfileId(value: string): boolean {
  return HUB_PROFILE_ID_SET.has(value.trim());
}

export function normalizeSupportedProfilesList(
  value: readonly string[] | null | undefined,
): { profiles: string[]; invalid: string[] } {
  if (!Array.isArray(value)) {
    return { profiles: [], invalid: [] };
  }

  const normalized = uniquePreserved(
    value.filter((item): item is string => typeof item === "string"),
  );

  const profiles: string[] = [];
  const invalid: string[] = [];
  for (const item of normalized) {
    if (isSupportedHubProfileId(item)) {
      profiles.push(item);
    } else {
      invalid.push(item);
    }
  }

  return { profiles, invalid };
}

export function readStoredSupportedProfiles(value: unknown): {
  profiles: string[];
  explicit: boolean;
  invalid: string[];
} {
  if (!Array.isArray(value)) {
    return { profiles: [], explicit: false, invalid: [] };
  }

  const normalized = normalizeSupportedProfilesList(
    value.filter((item): item is string => typeof item === "string"),
  );
  return {
    profiles: normalized.profiles,
    explicit: true,
    invalid: normalized.invalid,
  };
}
