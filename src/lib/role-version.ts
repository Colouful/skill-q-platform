export type RoleVersionFileEntry = {
  name: string;
  path: string;
  content?: string;
};

export type RoleVersionSnapshotInput = {
  name: string;
  slug: string;
  author: string;
  description: string;
  longDescription?: string | null;
  publishStatus: string;
  roleStatus: string;
  supportedProfiles: string[];
  tags: string[];
  triggers: string[];
  preferredSkills: string[];
  reads: string[];
  writes: string[];
  handoffTo: string[];
  rolePositioning?: string | null;
  workingPrinciples: string[];
  requiredSteps: string[];
  executionContract?: string | null;
  outputStandard?: string | null;
  prohibitedActions: string[];
  handoffNotes?: string | null;
  skillSlugs: string[];
  ruleSlugs: string[];
  domainSlugs: string[];
};

export function buildRoleVersionFiles(input: RoleVersionSnapshotInput): RoleVersionFileEntry[] {
  return [
    {
      name: `${input.slug}.role.json`,
      path: `.hub/roles/${input.slug}.role.json`,
      content: JSON.stringify(
        {
          name: input.name,
          slug: input.slug,
          author: input.author,
          description: input.description,
          longDescription: input.longDescription ?? null,
          publishStatus: input.publishStatus,
          roleStatus: input.roleStatus,
          supportedProfiles: input.supportedProfiles,
          tags: input.tags,
          triggers: input.triggers,
          preferredSkills: input.preferredSkills,
          reads: input.reads,
          writes: input.writes,
          handoffTo: input.handoffTo,
          skills: input.skillSlugs,
          rules: input.ruleSlugs,
          capabilityDomains: input.domainSlugs,
          sections: {
            rolePositioning: input.rolePositioning ?? null,
            workingPrinciples: input.workingPrinciples,
            requiredSteps: input.requiredSteps,
            executionContract: input.executionContract ?? null,
            outputStandard: input.outputStandard ?? null,
            prohibitedActions: input.prohibitedActions,
            handoffNotes: input.handoffNotes ?? null,
          },
        },
        null,
        2,
      ),
    },
  ];
}

export function normalizeRoleVersionFiles(raw: unknown): RoleVersionFileEntry[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        name: typeof item.name === "string" && item.name.trim() ? item.name : "role.json",
        path: typeof item.path === "string" && item.path.trim() ? item.path : ".hub/roles/role.json",
        ...(typeof item.content === "string" ? { content: item.content } : {}),
      }));
  }

  if (raw && typeof raw === "object") {
    return [
      {
        name: "role.json",
        path: ".hub/roles/role.json",
        content: JSON.stringify(raw, null, 2),
      },
    ];
  }

  return [];
}

export function suggestNextPatchVersion(currentVersions: string[]): string {
  const parsed = currentVersions
    .map((value) => {
      const match = value.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
      if (!match) return null;
      return {
        raw: value,
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
      };
    })
    .filter(Boolean) as Array<{ raw: string; major: number; minor: number; patch: number }>;

  if (parsed.length === 0) {
    return "1.0.0";
  }

  parsed.sort((a, b) => {
    if (a.major !== b.major) return b.major - a.major;
    if (a.minor !== b.minor) return b.minor - a.minor;
    return b.patch - a.patch;
  });

  const latest = parsed[0]!;
  return `${latest.major}.${latest.minor}.${latest.patch + 1}`;
}
