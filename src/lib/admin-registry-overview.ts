import { prisma } from "@/lib/prisma";
import { stringArrayFromJson } from "@/lib/catalog";

export type RegistryOverviewResourceType = "skill" | "rule" | "role";

export type RegistryOverviewStatus =
  | "ready"
  | "missing-registry"
  | "missing-manifest"
  | "mismatch";

export type RegistryOverviewItem = {
  id: string;
  name: string;
  slug: string;
  registryId: string | null;
  manifestId: string | null;
  supportedProfiles: string[];
  status: RegistryOverviewStatus;
  statusLabel: string;
  hasRegistryId: boolean;
  hasManifestId: boolean;
  isCanonicalReady: boolean;
  isMismatch: boolean;
  editHref: string;
};

export type RegistryOverviewSummary = {
  total: number;
  hasRegistryId: number;
  hasManifestId: number;
  canonicalReady: number;
  matchingIds: number;
  missingRegistryId: number;
  missingManifestId: number;
  mismatch: number;
};

export type RegistryOverviewSection = {
  resourceType: RegistryOverviewResourceType;
  label: string;
  items: RegistryOverviewItem[];
  summary: RegistryOverviewSummary;
};

export type RegistryOverviewPayload = {
  skills: RegistryOverviewSection;
  rules: RegistryOverviewSection;
  roles: RegistryOverviewSection;
};

type BaseRow = {
  id: string;
  name: string;
  slug: string;
  registryId: string | null;
  manifestId: string | null;
  supportedProfiles: unknown;
};

function normalizeValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getRegistryOverviewStatus(
  registryId: string | null | undefined,
  manifestId: string | null | undefined,
): RegistryOverviewStatus {
  const normalizedRegistryId = normalizeValue(registryId);
  const normalizedManifestId = normalizeValue(manifestId);

  if (!normalizedRegistryId) return "missing-registry";
  if (!normalizedManifestId) return "missing-manifest";
  if (normalizedRegistryId !== normalizedManifestId) return "mismatch";
  return "ready";
}

export function getRegistryOverviewStatusLabel(status: RegistryOverviewStatus): string {
  switch (status) {
    case "ready":
      return "已补齐";
    case "missing-registry":
      return "缺 registryId";
    case "missing-manifest":
      return "缺 manifestId";
    case "mismatch":
      return "协议字段不一致";
    default:
      return "未补齐";
  }
}

function getEditHref(resourceType: RegistryOverviewResourceType, slug: string): string {
  if (resourceType === "skill") return `/admin/skills/${slug}/edit`;
  if (resourceType === "rule") return `/admin/rules/${slug}/edit`;
  return `/admin/roles?edit=${encodeURIComponent(slug)}`;
}

export function buildRegistryOverviewSection(
  resourceType: RegistryOverviewResourceType,
  label: string,
  rows: BaseRow[],
): RegistryOverviewSection {
  const items = rows.map((row) => {
    const registryId = normalizeValue(row.registryId);
    const manifestId = normalizeValue(row.manifestId);
    const status = getRegistryOverviewStatus(registryId, manifestId);
    const hasRegistryId = Boolean(registryId);
    const hasManifestId = Boolean(manifestId);
    const isMismatch = Boolean(registryId && manifestId && registryId !== manifestId);
    const isCanonicalReady = Boolean(registryId && manifestId && registryId === manifestId);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      registryId,
      manifestId,
      supportedProfiles: stringArrayFromJson(row.supportedProfiles),
      status,
      statusLabel: getRegistryOverviewStatusLabel(status),
      hasRegistryId,
      hasManifestId,
      isCanonicalReady,
      isMismatch,
      editHref: getEditHref(resourceType, row.slug),
    } satisfies RegistryOverviewItem;
  });

  return {
    resourceType,
    label,
    items,
    summary: {
      total: items.length,
      hasRegistryId: items.filter((item) => item.hasRegistryId).length,
      hasManifestId: items.filter((item) => item.hasManifestId).length,
      canonicalReady: items.filter((item) => item.isCanonicalReady).length,
      matchingIds: items.filter((item) => item.isCanonicalReady).length,
      missingRegistryId: items.filter((item) => item.status === "missing-registry").length,
      missingManifestId: items.filter((item) => item.status === "missing-manifest").length,
      mismatch: items.filter((item) => item.isMismatch).length,
    },
  };
}

export async function getAdminRegistryOverview(): Promise<RegistryOverviewPayload> {
  const [skills, rules, roles] = await Promise.all([
    prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        registryId: true,
        manifestId: true,
        supportedProfiles: true,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    }),
    prisma.rule.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        registryId: true,
        manifestId: true,
        supportedProfiles: true,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    }),
    prisma.roleTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        registryId: true,
        manifestId: true,
        supportedProfiles: true,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    }),
  ]);

  return {
    skills: buildRegistryOverviewSection("skill", "Skill 协议完整度", skills),
    rules: buildRegistryOverviewSection("rule", "Rule 协议完整度", rules),
    roles: buildRegistryOverviewSection("role", "Role 协议完整度", roles),
  };
}
