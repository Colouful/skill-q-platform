import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS, stringArrayFromJson } from "@/lib/catalog";
import { sanitizeCatalogSlug } from "@/lib/catalog-slug";
import type { InstallPreviewInput } from "@/lib/install-preview";
import { MODERATION_STATUS } from "@/lib/moderation";
import {
  getHubProfileIds,
  getHubProfileLabel,
  readStoredSupportedProfiles,
} from "@/lib/profile-options";
import { isRuleManifestPath, isRulePrimaryMarkdownPath } from "@/lib/rule-manifest-path";
import { buildInstallManifest, type ScenarioManifest } from "@/lib/scenario-manifest";
import { metaToRuleHints, metaToSkillHints, parseSkillMd } from "@/lib/skill-md-parse";
import { parseVersionFilesJson, type SkillFileEntry } from "@/lib/skill-file-entries";

type ExportFileEntry = {
  path: string;
  content: string;
};

type ExportAssetReport = {
  hubSlug: string;
  hubName: string;
  registryId: string;
  mode: "common" | "profiled";
  profiles: string[];
  source?: string;
  sourceByProfile?: Record<string, string>;
};

type ExportRoleReport = {
  hubSlug: string;
  registryId: string;
  source: string;
  skills: string[];
  rules: string[];
};

type ExportScenarioReport = {
  hubSlug: string;
  registryId: string;
  profiles: string[];
  roles: string[];
  skills: string[];
  rules: string[];
};

export type BrAiSpecExportReport = {
  generatedAt: string;
  manifest: ScenarioManifest;
  warnings: string[];
  assets: {
    roles: ExportRoleReport[];
    skills: ExportAssetReport[];
    rules: ExportAssetReport[];
    scenarios: ExportScenarioReport[];
  };
};

export type BrAiSpecExportBundle = {
  manifest: ScenarioManifest;
  warnings: string[];
  report: BrAiSpecExportReport;
  files: ExportFileEntry[];
};

type VersionLike = {
  files: unknown;
  isLatest: boolean;
  createdAt: Date;
};

type SlotOwner = {
  hubSlug: string;
  updatedAtMs: number;
};

type AssetFilesPlan = {
  mainContent: string;
  extraFiles: SkillFileEntry[];
  hasManifestFile: boolean;
};

const COMMON_SLOT = "common";

function normalizeList(items: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (items ?? [])
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(
    new Set(
      Array.from(values)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function uniqueList(values: Iterable<string>): string[] {
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

function maybeArray<T>(value: T[]): T[] | undefined {
  return value.length > 0 ? value : undefined;
}

function normalizeRelativePath(rawPath: string | null | undefined): string | null {
  const normalized = (rawPath ?? "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) return null;

  const segments = normalized
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  if (segments.length === 0) return null;
  if (segments.some((item) => item === "." || item === "..")) return null;

  return segments.join("/");
}

function isSkillManifestPath(path: string): boolean {
  return /(^|\/)skill\.md$/i.test(path);
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function pickLatestVersion<T extends VersionLike>(versions: T[]): T | null {
  if (versions.length === 0) return null;
  return [...versions].sort((a, b) => {
    if (a.isLatest !== b.isLatest) return a.isLatest ? -1 : 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0]!;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripProfileAffix(raw: string, knownProfiles: Iterable<string>): string {
  let next = raw.trim();
  if (!next) return "";

  const profiles = uniqueSorted(knownProfiles).sort((a, b) => b.length - a.length);
  for (const profile of profiles) {
    const safe = escapeRegExp(profile);
    next = next
      .replace(new RegExp(`\\[profiles\\/${safe}\\]`, "ig"), " ")
      .replace(new RegExp(`\\[${safe}\\]`, "ig"), " ")
      .replace(new RegExp(`\\(${safe}\\)`, "ig"), " ")
      .replace(new RegExp(`^${safe}[-_\\s]+`, "i"), "")
      .replace(new RegExp(`[-_\\s]+${safe}$`, "i"), "")
      .trim();
  }
  return next.trim();
}

function normalizeRegistryId(
  raw: string | null | undefined,
  fallback: string,
  knownProfiles: Iterable<string>,
): string {
  const stripped = stripProfileAffix(raw ?? "", knownProfiles);
  const sanitized = sanitizeCatalogSlug(stripped);
  if (sanitized) return sanitized;

  const fallbackStripped = stripProfileAffix(fallback, knownProfiles);
  const fallbackSanitized = sanitizeCatalogSlug(fallbackStripped);
  if (fallbackSanitized) return fallbackSanitized;

  return "hub-asset";
}

function looksLikeRegistryId(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  return !!trimmed && /^[a-z0-9._-]+$/i.test(trimmed);
}

function createProfileSet(input: {
  requestedProfile?: string;
  scenarioProfiles?: string[];
  roleProfiles?: string[];
  explicitProfiles?: string[];
}): string[] {
  return uniqueSorted([
    ...(input.requestedProfile ? [input.requestedProfile] : []),
    ...(input.scenarioProfiles ?? []),
    ...(input.roleProfiles ?? []),
    ...(input.explicitProfiles ?? []),
    ...getHubProfileIds(),
  ]);
}

export function inferAssetProfiles(input: {
  explicitProfiles?: string[];
  hubSlug: string;
  hubName?: string | null;
  knownProfiles: Iterable<string>;
}): string[] {
  const explicit = uniqueSorted(input.explicitProfiles ?? []);
  if (explicit.length > 0) return explicit;

  const target = `${input.hubSlug} ${(input.hubName ?? "").trim()}`.toLowerCase();
  const matched = uniqueSorted(input.knownProfiles).filter((profile) => {
    const lower = profile.toLowerCase();
    if (!lower) return false;
    return (
      target.includes(`[profiles/${lower}]`) ||
      target.includes(`[${lower}]`) ||
      target.includes(`(${lower})`) ||
      target.startsWith(`${lower}-`) ||
      target.endsWith(`-${lower}`) ||
      target.includes(` ${lower} `) ||
      target.startsWith(`${lower} `) ||
      target.endsWith(` ${lower}`) ||
      target === lower
    );
  });
  return matched;
}

export function inferSkillRegistryId(input: {
  hubSlug: string;
  hubName: string;
  manifestContent?: string | null;
  profiles?: string[];
  knownProfiles: Iterable<string>;
}): string {
  const parsed = input.manifestContent ? parseSkillMd(input.manifestContent) : null;
  const hints = parsed ? metaToSkillHints(parsed.meta) : {};
  const hintedName =
    hints.name && looksLikeRegistryId(hints.name)
      ? hints.name.trim().toLowerCase()
      : null;

  return normalizeRegistryId(
    firstNonEmpty(hintedName, input.hubSlug, input.hubName),
    input.hubSlug,
    [...(input.profiles ?? []), ...input.knownProfiles],
  );
}

export function inferRuleRegistryId(input: {
  hubSlug: string;
  hubName: string;
  manifestContent?: string | null;
  profiles?: string[];
  knownProfiles: Iterable<string>;
}): string {
  const parsed = input.manifestContent ? parseSkillMd(input.manifestContent) : null;
  const hints = parsed ? metaToRuleHints(parsed.meta) : {};
  const hintedName =
    hints.name && looksLikeRegistryId(hints.name)
      ? hints.name.trim().toLowerCase()
      : null;

  return normalizeRegistryId(
    firstNonEmpty(hintedName, input.hubSlug, input.hubName),
    input.hubSlug,
    [...(input.profiles ?? []), ...input.knownProfiles],
  );
}

function sanitizeFileEntries(files: SkillFileEntry[]): SkillFileEntry[] {
  const out: SkillFileEntry[] = [];
  for (const file of files) {
    const safePath = normalizeRelativePath(file.path) ?? normalizeRelativePath(file.name) ?? file.name;
    if (!safePath) continue;
    out.push({
      ...file,
      path: safePath,
    });
  }
  return out;
}

function buildSkillManifestMarkdown(input: {
  registryId: string;
  title: string;
  description: string;
  body: string;
}): string {
  return [
    "---",
    `name: ${JSON.stringify(input.registryId)}`,
    `description: ${JSON.stringify(input.description)}`,
    "---",
    "",
    `# ${input.title}`,
    "",
    input.body.trim() || input.description.trim(),
    "",
  ].join("\n");
}

function buildRuleManifestMarkdown(input: {
  title: string;
  description: string;
  body: string;
}): string {
  return [
    "---",
    "alwaysApply: false",
    `description: ${JSON.stringify(input.description)}`,
    "---",
    "",
    `# ${input.title}`,
    "",
    input.body.trim() || input.description.trim(),
    "",
  ].join("\n");
}

function buildSkillFilesPlan(input: {
  hubSlug: string;
  hubName: string;
  registryId: string;
  description: string;
  longDescription?: string | null;
  versions: VersionLike[];
  warnings: string[];
}): AssetFilesPlan {
  const version = pickLatestVersion(input.versions);
  const files = version ? sanitizeFileEntries(parseVersionFilesJson(version.files)) : [];
  const manifestFile = files.find((item) => isSkillManifestPath(item.path));
  const mainContent =
    manifestFile?.content ||
    buildSkillManifestMarkdown({
      registryId: input.registryId,
      title: input.hubName,
      description: input.description,
      body: input.longDescription ?? "",
    });

  if (!manifestFile) {
    input.warnings.push(`Skill ${input.hubSlug} 缺少 SKILL.md，导出时已补默认清单。`);
  }

  return {
    mainContent,
    extraFiles: files.filter((item) => item !== manifestFile),
    hasManifestFile: !!manifestFile,
  };
}

function pickRulePrimaryFile(files: SkillFileEntry[]): SkillFileEntry | null {
  const manifestFile = files.find((item) => isRuleManifestPath(item.path));
  if (manifestFile) return manifestFile;

  const markdownFiles = files.filter((item) => isRulePrimaryMarkdownPath(item.path));
  if (markdownFiles.length === 1) return markdownFiles[0]!;
  return markdownFiles[0] ?? null;
}

function buildRuleFilesPlan(input: {
  hubSlug: string;
  hubName: string;
  description: string;
  longDescription?: string | null;
  versions: VersionLike[];
  warnings: string[];
}): AssetFilesPlan {
  const version = pickLatestVersion(input.versions);
  const files = version ? sanitizeFileEntries(parseVersionFilesJson(version.files)) : [];
  const manifestFile = pickRulePrimaryFile(files);
  const mainContent =
    manifestFile?.content ||
    buildRuleManifestMarkdown({
      title: input.hubName,
      description: input.description,
      body: input.longDescription ?? "",
    });

  if (!manifestFile) {
    input.warnings.push(`Rule ${input.hubSlug} 缺少主 Markdown，导出时已补默认 RULE.md。`);
  } else if (!isRuleManifestPath(manifestFile.path)) {
    input.warnings.push(`Rule ${input.hubSlug} 主说明不是 RULE.md，导出时已统一为 RULE.md。`);
  }

  return {
    mainContent,
    extraFiles: files.filter((item) => item !== manifestFile),
    hasManifestFile: !!manifestFile,
  };
}

function buildProfilesRegistryDocument(profiles: string[]): string {
  const sortedProfiles = uniqueSorted(profiles);
  const entries = Object.fromEntries(
    sortedProfiles.map((profile) => [
      profile,
      {
        status: "active",
        label: getHubProfileLabel(profile),
        rules_dir: `.agents/rules/profiles/${profile}`,
        skills_dir: `.agents/skills/profiles/${profile}`,
        configs_dir: `configs/profiles/${profile}`,
        aliases: [],
      },
    ]),
  );

  return JSON.stringify(
    {
      version: 1,
      profiles: entries,
    },
    null,
    2,
  );
}

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}

function yamlStringArray(key: string, items: string[]): string[] {
  if (items.length === 0) return [];
  return [ `${key}:`, ...items.map((item) => `  - ${yamlScalar(item)}`) ];
}

function renderRoleSection(title: string, content: string | string[]): string | null {
  if (Array.isArray(content)) {
    if (content.length === 0) return null;
    const lines = content.map((item, index) =>
      title === "必做步骤" ? `${index + 1}. ${item}` : `- ${item}`,
    );
    return [`## ${title}`, "", ...lines, ""].join("\n");
  }

  const trimmed = content.trim();
  if (!trimmed) return null;
  return [`## ${title}`, "", trimmed, ""].join("\n");
}

export function renderRoleMarkdown(input: {
  slug: string;
  name: string;
  status: string;
  description: string;
  longDescription?: string | null;
  domains: string[];
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
}): string {
  const frontmatterLines = [
    "---",
    `id: ${yamlScalar(input.slug)}`,
    `name: ${yamlScalar(input.name)}`,
    `status: ${yamlScalar(input.status)}`,
    ...yamlStringArray("domains", input.domains),
    `description: ${yamlScalar(input.description)}`,
    ...yamlStringArray("triggers", input.triggers),
    ...yamlStringArray("preferred_skills", input.preferredSkills),
    ...yamlStringArray("reads", input.reads),
    ...yamlStringArray("writes", input.writes),
    ...yamlStringArray("handoff_to", input.handoffTo),
    "---",
    "",
  ];

  const sections = [
    `# ${input.name}`,
    "",
    (input.longDescription ?? "").trim() || input.description.trim(),
    "",
    renderRoleSection("角色定位", input.rolePositioning ?? ""),
    renderRoleSection("工作原则", input.workingPrinciples),
    renderRoleSection("必做步骤", input.requiredSteps),
    renderRoleSection("执行契约", input.executionContract ?? ""),
    renderRoleSection("输出标准", input.outputStandard ?? ""),
    renderRoleSection("禁止事项", input.prohibitedActions),
    renderRoleSection("交接说明", input.handoffNotes ?? ""),
  ].filter(Boolean);

  return [...frontmatterLines, ...sections].join("\n").trimEnd() + "\n";
}

function setTextFile(
  files: Map<string, string>,
  path: string,
  content: string,
) {
  files.set(path, content);
}

function applySlotFiles(input: {
  slotKey: string;
  hubSlug: string;
  updatedAt: Date;
  registryEntry: { source?: string; sourceByProfile?: Record<string, string> };
  sourcePath: string;
  variantKey: string;
  files: ExportFileEntry[];
  filesMap: Map<string, string>;
  slotOwners: Map<string, SlotOwner>;
  slotFiles: Map<string, string[]>;
  warnings: string[];
}) {
  const previousOwner = input.slotOwners.get(input.slotKey);
  const nextUpdatedAtMs = input.updatedAt.getTime();
  if (previousOwner && previousOwner.updatedAtMs > nextUpdatedAtMs) {
    input.warnings.push(
      `${input.hubSlug} 与 ${previousOwner.hubSlug} 命中同一导出槽位 ${input.slotKey}，已保留较新的 ${previousOwner.hubSlug}。`,
    );
    return false;
  }

  if (previousOwner) {
    input.warnings.push(
      `${input.hubSlug} 覆盖了 ${previousOwner.hubSlug} 的导出槽位 ${input.slotKey}。`,
    );
    for (const existingPath of input.slotFiles.get(input.slotKey) ?? []) {
      input.filesMap.delete(existingPath);
    }
  }

  for (const file of input.files) {
    setTextFile(input.filesMap, file.path, file.content);
  }
  input.slotOwners.set(input.slotKey, {
    hubSlug: input.hubSlug,
    updatedAtMs: nextUpdatedAtMs,
  });
  input.slotFiles.set(
    input.slotKey,
    input.files.map((item) => item.path),
  );

  if (input.variantKey === COMMON_SLOT) {
    input.registryEntry.source = input.sourcePath;
  } else {
    input.registryEntry.sourceByProfile = {
      ...(input.registryEntry.sourceByProfile ?? {}),
      [input.variantKey]: input.sourcePath,
    };
  }

  return true;
}

async function buildZip(files: ExportFileEntry[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
}

export async function buildBrAiSpecExportBundle(
  input: InstallPreviewInput,
): Promise<BrAiSpecExportBundle> {
  const scenarioSlugs = normalizeList(input.scenario_packages);
  const requestedRoleSlugs = normalizeList(input.roles);
  const requestedSkillSlugs = normalizeList(input.skills);
  const requestedRuleSlugs = normalizeList(input.rules);
  const requestedIdes = normalizeList(input.ides);
  const warnings: string[] = [];

  const scenarios = await prisma.scenarioPackage.findMany({
    where: {
      publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
      slug: { in: scenarioSlugs.length > 0 ? scenarioSlugs : ["__none__"] },
    },
    include: {
      entryRole: true,
      domainLinks: {
        include: {
          domain: { select: { slug: true } },
        },
      },
      roles: {
        where: { role: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
        include: {
          role: { select: { slug: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      skills: {
        where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        include: {
          skill: { select: { slug: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      rules: {
        where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        include: {
          rule: { select: { slug: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const foundScenarioSlugs = new Set(scenarios.map((item) => item.slug));
  scenarioSlugs.forEach((slug) => {
    if (!foundScenarioSlugs.has(slug)) warnings.push(`场景方案不存在或未发布：${slug}`);
  });

  const scenarioRoleSlugs = scenarios.flatMap((item) => item.roles.map((link) => link.role.slug));
  const scenarioEntryRoleSlugs = scenarios.flatMap((item) => (item.entryRole?.slug ? [item.entryRole.slug] : []));
  const allRoleSlugs = uniqueSorted([
    ...requestedRoleSlugs,
    ...scenarioRoleSlugs,
    ...scenarioEntryRoleSlugs,
  ]);

  const roles = await prisma.roleTemplate.findMany({
    where: {
      publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
      slug: { in: allRoleSlugs.length > 0 ? allRoleSlugs : ["__none__"] },
    },
    include: {
      skillLinks: {
        include: {
          skill: {
            select: {
              slug: true,
              moderationStatus: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      ruleLinks: {
        include: {
          rule: {
            select: {
              slug: true,
              moderationStatus: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      domainLinks: {
        include: {
          domain: { select: { slug: true } },
        },
      },
      versions: {
        orderBy: [{ isLatest: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: { slug: "asc" },
  });

  const foundRoleSlugs = new Set(roles.map((item) => item.slug));
  requestedRoleSlugs.forEach((slug) => {
    if (!foundRoleSlugs.has(slug)) warnings.push(`专家不存在或未发布：${slug}`);
  });
  scenarioEntryRoleSlugs.forEach((slug) => {
    if (!foundRoleSlugs.has(slug)) warnings.push(`场景入口专家不存在或未发布：${slug}`);
  });

  const roleProfiles = roles.flatMap((item) => stringArrayFromJson(item.supportedProfiles));
  const scenarioProfiles = scenarios.flatMap((item) => stringArrayFromJson(item.supportedProfiles));
  const knownProfiles = createProfileSet({
    requestedProfile: input.profile?.trim(),
    scenarioProfiles,
    roleProfiles,
  });

  const roleSkillSlugs = roles.flatMap((item) =>
    item.skillLinks
      .filter((link) => link.skill.moderationStatus === MODERATION_STATUS.PUBLISHED)
      .map((link) => link.skill.slug),
  );
  const roleRuleSlugs = roles.flatMap((item) =>
    item.ruleLinks
      .filter((link) => link.rule.moderationStatus === MODERATION_STATUS.PUBLISHED)
      .map((link) => link.rule.slug),
  );

  const scenarioSkillSlugs = scenarios.flatMap((item) => item.skills.map((link) => link.skill.slug));
  const scenarioRuleSlugs = scenarios.flatMap((item) => item.rules.map((link) => link.rule.slug));
  const allSkillSlugs = uniqueSorted([
    ...requestedSkillSlugs,
    ...scenarioSkillSlugs,
    ...roleSkillSlugs,
  ]);
  const allRuleSlugs = uniqueSorted([
    ...requestedRuleSlugs,
    ...scenarioRuleSlugs,
    ...roleRuleSlugs,
  ]);

  const [skills, rules] = await Promise.all([
    prisma.skill.findMany({
      where: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        slug: { in: allSkillSlugs.length > 0 ? allSkillSlugs : ["__none__"] },
      },
      include: {
        versions: {
          orderBy: [{ isLatest: "desc" }, { createdAt: "desc" }],
        },
        domainLinks: {
          include: {
            domain: { select: { slug: true } },
          },
        },
      },
      orderBy: { slug: "asc" },
    }),
    prisma.rule.findMany({
      where: {
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        slug: { in: allRuleSlugs.length > 0 ? allRuleSlugs : ["__none__"] },
      },
      include: {
        versions: {
          orderBy: [{ isLatest: "desc" }, { createdAt: "desc" }],
        },
        domainLinks: {
          include: {
            domain: { select: { slug: true } },
          },
        },
      },
      orderBy: { slug: "asc" },
    }),
  ]);

  const foundSkillSlugs = new Set(skills.map((item) => item.slug));
  const foundRuleSlugs = new Set(rules.map((item) => item.slug));
  requestedSkillSlugs.forEach((slug) => {
    if (!foundSkillSlugs.has(slug)) warnings.push(`Skill 不存在或未发布：${slug}`);
  });
  requestedRuleSlugs.forEach((slug) => {
    if (!foundRuleSlugs.has(slug)) warnings.push(`Rule 不存在或未发布：${slug}`);
  });

  const filesMap = new Map<string, string>();
  const skillSlotOwners = new Map<string, SlotOwner>();
  const skillSlotFiles = new Map<string, string[]>();
  const ruleSlotOwners = new Map<string, SlotOwner>();
  const ruleSlotFiles = new Map<string, string[]>();
  const usedProfiles = new Set<string>();

  const skillRegistryEntries = new Map<
    string,
    { source?: string; sourceByProfile?: Record<string, string>; domains?: string[] }
  >();
  const ruleRegistryEntries = new Map<
    string,
    { source?: string; sourceByProfile?: Record<string, string>; domains?: string[] }
  >();
  const skillRegistryIdByHubSlug = new Map<string, string>();
  const ruleRegistryIdByHubSlug = new Map<string, string>();
  const skillReports: ExportAssetReport[] = [];
  const ruleReports: ExportAssetReport[] = [];

  const sortedSkills = [...skills].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
  for (const skill of sortedSkills) {
    const storedProfiles = readStoredSupportedProfiles(skill.supportedProfiles);
    const profiles = storedProfiles.explicit
      ? storedProfiles.profiles
      : inferAssetProfiles({
          hubSlug: skill.slug,
          hubName: skill.name,
          knownProfiles,
        });
    if (storedProfiles.invalid.length > 0) {
      warnings.push(
        `Skill ${skill.slug} 含未识别的 supportedProfiles：${storedProfiles.invalid.join("、")}，已忽略这些值。`,
      );
    }
    const filesPlan = buildSkillFilesPlan({
      hubSlug: skill.slug,
      hubName: skill.name,
      registryId: skill.slug,
      description: skill.description,
      longDescription: skill.longDescription,
      versions: skill.versions,
      warnings,
    });
    const registryId = inferSkillRegistryId({
      hubSlug: skill.slug,
      hubName: skill.name,
      manifestContent: filesPlan.mainContent,
      profiles,
      knownProfiles,
    });
    if (!filesPlan.hasManifestFile) {
      filesPlan.mainContent = buildSkillManifestMarkdown({
        registryId,
        title: skill.name,
        description: skill.description,
        body: skill.longDescription ?? "",
      });
    }
    const registryEntry =
      skillRegistryEntries.get(registryId) ??
      {
        domains: maybeArray(
          uniqueSorted(skill.domainLinks.map((item) => item.domain.slug)),
        ),
      };
    registryEntry.domains = maybeArray(
      uniqueSorted([
        ...(registryEntry.domains ?? []),
        ...skill.domainLinks.map((item) => item.domain.slug),
      ]),
    );
    skillRegistryEntries.set(registryId, registryEntry);
    skillRegistryIdByHubSlug.set(skill.slug, registryId);

    const variantKeys = profiles.length > 0 ? profiles : [COMMON_SLOT];
    for (const variantKey of variantKeys) {
      const baseDir =
        variantKey === COMMON_SLOT
          ? `.agents/skills/common/${registryId}`
          : `.agents/skills/profiles/${variantKey}/${registryId}`;
      const sourcePath = `${baseDir}/SKILL.md`;
      const nextFiles: ExportFileEntry[] = [
        { path: sourcePath, content: filesPlan.mainContent },
        ...filesPlan.extraFiles
          .map((file) => {
            const normalized = normalizeRelativePath(file.path);
            if (!normalized || isSkillManifestPath(normalized)) return null;
            return {
              path: `${baseDir}/${normalized}`,
              content: file.content ?? "",
            };
          })
          .filter(Boolean) as ExportFileEntry[],
      ];

      applySlotFiles({
        slotKey: `skill:${registryId}:${variantKey}`,
        hubSlug: skill.slug,
        updatedAt: skill.updatedAt,
        registryEntry,
        sourcePath,
        variantKey,
        files: nextFiles,
        filesMap,
        slotOwners: skillSlotOwners,
        slotFiles: skillSlotFiles,
        warnings,
      });

      if (variantKey !== COMMON_SLOT) usedProfiles.add(variantKey);
    }

    skillReports.push({
      hubSlug: skill.slug,
      hubName: skill.name,
      registryId,
      mode: profiles.length > 0 ? "profiled" : "common",
      profiles,
      ...(registryEntry.source ? { source: registryEntry.source } : {}),
      ...(registryEntry.sourceByProfile ? { sourceByProfile: registryEntry.sourceByProfile } : {}),
    });
  }

  const sortedRules = [...rules].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
  for (const rule of sortedRules) {
    const storedProfiles = readStoredSupportedProfiles(rule.supportedProfiles);
    const profiles = storedProfiles.explicit
      ? storedProfiles.profiles
      : inferAssetProfiles({
          hubSlug: rule.slug,
          hubName: rule.name,
          knownProfiles,
        });
    if (storedProfiles.invalid.length > 0) {
      warnings.push(
        `Rule ${rule.slug} 含未识别的 supportedProfiles：${storedProfiles.invalid.join("、")}，已忽略这些值。`,
      );
    }
    const filesPlan = buildRuleFilesPlan({
      hubSlug: rule.slug,
      hubName: rule.name,
      description: rule.description,
      longDescription: rule.longDescription,
      versions: rule.versions,
      warnings,
    });
    const registryId = inferRuleRegistryId({
      hubSlug: rule.slug,
      hubName: rule.name,
      manifestContent: filesPlan.mainContent,
      profiles,
      knownProfiles,
    });
    const registryEntry =
      ruleRegistryEntries.get(registryId) ??
      {
        domains: maybeArray(
          uniqueSorted(rule.domainLinks.map((item) => item.domain.slug)),
        ),
      };
    registryEntry.domains = maybeArray(
      uniqueSorted([
        ...(registryEntry.domains ?? []),
        ...rule.domainLinks.map((item) => item.domain.slug),
      ]),
    );
    ruleRegistryEntries.set(registryId, registryEntry);
    ruleRegistryIdByHubSlug.set(rule.slug, registryId);

    const variantKeys = profiles.length > 0 ? profiles : [COMMON_SLOT];
    for (const variantKey of variantKeys) {
      const baseDir =
        variantKey === COMMON_SLOT
          ? `.agents/rules/common/${registryId}`
          : `.agents/rules/profiles/${variantKey}/${registryId}`;
      const sourcePath = `${baseDir}/RULE.md`;
      const nextFiles: ExportFileEntry[] = [
        { path: sourcePath, content: filesPlan.mainContent },
        ...filesPlan.extraFiles
          .map((file) => {
            const normalized = normalizeRelativePath(file.path);
            if (!normalized || isRulePrimaryMarkdownPath(normalized)) return null;
            return {
              path: `${baseDir}/${normalized}`,
              content: file.content ?? "",
            };
          })
          .filter(Boolean) as ExportFileEntry[],
      ];

      applySlotFiles({
        slotKey: `rule:${registryId}:${variantKey}`,
        hubSlug: rule.slug,
        updatedAt: rule.updatedAt,
        registryEntry,
        sourcePath,
        variantKey,
        files: nextFiles,
        filesMap,
        slotOwners: ruleSlotOwners,
        slotFiles: ruleSlotFiles,
        warnings,
      });

      if (variantKey !== COMMON_SLOT) usedProfiles.add(variantKey);
    }

    ruleReports.push({
      hubSlug: rule.slug,
      hubName: rule.name,
      registryId,
      mode: profiles.length > 0 ? "profiled" : "common",
      profiles,
      ...(registryEntry.source ? { source: registryEntry.source } : {}),
      ...(registryEntry.sourceByProfile ? { sourceByProfile: registryEntry.sourceByProfile } : {}),
    });
  }

  const roleSkillIds = new Map<string, string[]>();
  const roleRuleIds = new Map<string, string[]>();
  const roleReports: ExportRoleReport[] = [];
  const rolesRegistry: Record<string, Record<string, unknown>> = {};
  for (const role of roles) {
    const exportedSkillIds = uniqueList(
      role.skillLinks
        .map((link) => skillRegistryIdByHubSlug.get(link.skill.slug) ?? null)
        .filter((item): item is string => !!item),
    );
    const exportedRuleIds = uniqueList(
      role.ruleLinks
        .map((link) => ruleRegistryIdByHubSlug.get(link.rule.slug) ?? null)
        .filter((item): item is string => !!item),
    );
    roleSkillIds.set(role.slug, exportedSkillIds);
    roleRuleIds.set(role.slug, exportedRuleIds);

    const supportedProfiles = uniqueSorted(stringArrayFromJson(role.supportedProfiles));
    supportedProfiles.forEach((profile) => usedProfiles.add(profile));
    const roleSource = `.agents/roles/common/${role.slug}.md`;
    const roleMarkdown = renderRoleMarkdown({
      slug: role.slug,
      name: role.name,
      status: role.roleStatus || "draft",
      description: role.description,
      longDescription: role.longDescription,
      domains: uniqueSorted(role.domainLinks.map((item) => item.domain.slug)),
      triggers: uniqueList(stringArrayFromJson(role.triggers)),
      preferredSkills:
        exportedSkillIds.length > 0
          ? exportedSkillIds
          : uniqueList(stringArrayFromJson(role.preferredSkills)),
      reads: uniqueList(stringArrayFromJson(role.reads)),
      writes: uniqueList(stringArrayFromJson(role.writes)),
      handoffTo: uniqueList(stringArrayFromJson(role.handoffTo)),
      rolePositioning: role.rolePositioning,
      workingPrinciples: uniqueList(stringArrayFromJson(role.workingPrinciples)),
      requiredSteps: uniqueList(stringArrayFromJson(role.requiredSteps)),
      executionContract: role.executionContract,
      outputStandard: role.outputStandard,
      prohibitedActions: uniqueList(stringArrayFromJson(role.prohibitedActions)),
      handoffNotes: role.handoffNotes,
    });
    setTextFile(filesMap, roleSource, roleMarkdown);

    rolesRegistry[role.slug] = {
      name: role.name,
      status: role.roleStatus || "draft",
      ...(supportedProfiles.length > 0 ? { profiles: supportedProfiles } : {}),
      ...(role.domainLinks.length > 0
        ? { domains: uniqueSorted(role.domainLinks.map((item) => item.domain.slug)) }
        : {}),
      source: roleSource,
      ...(exportedRuleIds.length > 0 ? { rule_ids: exportedRuleIds } : {}),
      ...(exportedSkillIds.length > 0 ? { skill_priority: exportedSkillIds } : {}),
    };
    roleReports.push({
      hubSlug: role.slug,
      registryId: role.slug,
      source: roleSource,
      skills: exportedSkillIds,
      rules: exportedRuleIds,
    });
  }

  const scenariosRegistry: Record<string, Record<string, unknown>> = {};
  const scenarioReports: ExportScenarioReport[] = [];
  for (const scenario of scenarios) {
    const scenarioRoleIds = uniqueList([
      ...scenario.roles.map((link) => link.role.slug),
      ...(scenario.entryRole?.slug ? [scenario.entryRole.slug] : []),
    ].filter((slug) => rolesRegistry[slug]));
    const derivedSkillIds = uniqueList(
      scenarioRoleIds.flatMap((slug) => roleSkillIds.get(slug) ?? []),
    );
    const derivedRuleIds = uniqueList(
      scenarioRoleIds.flatMap((slug) => roleRuleIds.get(slug) ?? []),
    );
    const directSkillIds = uniqueList(
      scenario.skills
        .map((link) => skillRegistryIdByHubSlug.get(link.skill.slug) ?? null)
        .filter((item): item is string => !!item),
    );
    const directRuleIds = uniqueList(
      scenario.rules
        .map((link) => ruleRegistryIdByHubSlug.get(link.rule.slug) ?? null)
        .filter((item): item is string => !!item),
    );
    const scenarioProfilesForRegistry = uniqueSorted(stringArrayFromJson(scenario.supportedProfiles));
    scenarioProfilesForRegistry.forEach((profile) => usedProfiles.add(profile));

    const exportedScenarioSkills = uniqueList([...directSkillIds, ...derivedSkillIds]);
    const exportedScenarioRules = uniqueList([...directRuleIds, ...derivedRuleIds]);

    scenariosRegistry[scenario.slug] = {
      ...(scenarioProfilesForRegistry.length > 0 ? { profiles: scenarioProfilesForRegistry } : {}),
      roles: scenarioRoleIds,
      skills: exportedScenarioSkills,
      rules: exportedScenarioRules,
      ...(scenario.domainLinks.length > 0
        ? { domains: uniqueSorted(scenario.domainLinks.map((item) => item.domain.slug)) }
        : {}),
    };

    scenarioReports.push({
      hubSlug: scenario.slug,
      registryId: scenario.slug,
      profiles: scenarioProfilesForRegistry,
      roles: scenarioRoleIds,
      skills: exportedScenarioSkills,
      rules: exportedScenarioRules,
    });
  }

  const requestedRoleIds = uniqueList(
    requestedRoleSlugs.filter((slug) => rolesRegistry[slug]),
  );
  const scenarioRoleIdsForManifest = uniqueList(
    scenarios.flatMap((scenario) => {
      const entryRole = scenario.entryRole?.slug ? [scenario.entryRole.slug] : [];
      return [...scenario.roles.map((link) => link.role.slug), ...entryRole].filter(
        (slug) => rolesRegistry[slug],
      );
    }),
  );
  const manifestRoleIds = uniqueList([...requestedRoleIds, ...scenarioRoleIdsForManifest]);
  const requestedSkillIds = uniqueList(
    requestedSkillSlugs
      .map((slug) => skillRegistryIdByHubSlug.get(slug) ?? null)
      .filter((item): item is string => !!item),
  );
  const requestedRuleIds = uniqueList(
    requestedRuleSlugs
      .map((slug) => ruleRegistryIdByHubSlug.get(slug) ?? null)
      .filter((item): item is string => !!item),
  );
  const scenarioSkillIdsForManifest = uniqueList(
    scenarios.flatMap((scenario) => (scenariosRegistry[scenario.slug]?.skills as string[] | undefined) ?? []),
  );
  const scenarioRuleIdsForManifest = uniqueList(
    scenarios.flatMap((scenario) => (scenariosRegistry[scenario.slug]?.rules as string[] | undefined) ?? []),
  );
  const roleDerivedSkillIdsForManifest = uniqueList(
    manifestRoleIds.flatMap((slug) => roleSkillIds.get(slug) ?? []),
  );
  const roleDerivedRuleIdsForManifest = uniqueList(
    manifestRoleIds.flatMap((slug) => roleRuleIds.get(slug) ?? []),
  );

  const manifest = buildInstallManifest({
    profile:
      input.profile?.trim() ||
      scenarioProfiles[0] ||
      roleProfiles[0] ||
      "default",
    ides:
      requestedIdes.length > 0
        ? requestedIdes
        : scenarios.flatMap((scenario) => stringArrayFromJson(scenario.recommendedIdes)),
    scenarioPackages: scenarios.map((item) => item.slug),
    roles: manifestRoleIds,
    skills: uniqueList([
      ...requestedSkillIds,
      ...scenarioSkillIdsForManifest,
      ...roleDerivedSkillIdsForManifest,
    ]),
    rules: uniqueList([
      ...requestedRuleIds,
      ...scenarioRuleIdsForManifest,
      ...roleDerivedRuleIdsForManifest,
    ]),
    entryRole:
      scenarios.find((item) => item.entryRole?.slug && rolesRegistry[item.entryRole.slug])
        ?.entryRole?.slug ??
      manifestRoleIds[0] ??
      null,
  });

  if (manifest.profile && manifest.profile !== "default") {
    usedProfiles.add(manifest.profile);
  }

  const exportedProfiles = uniqueSorted(usedProfiles);
  for (const profile of exportedProfiles) {
    setTextFile(filesMap, `.agents/skills/profiles/${profile}/.gitkeep`, "");
    setTextFile(filesMap, `.agents/rules/profiles/${profile}/.gitkeep`, "");
    setTextFile(filesMap, `configs/profiles/${profile}/.gitkeep`, "");
  }

  setTextFile(
    filesMap,
    ".agents/registry/profiles.json",
    buildProfilesRegistryDocument(exportedProfiles),
  );
  setTextFile(
    filesMap,
    ".agents/registry/skills.json",
    JSON.stringify(
      {
        version: 1,
        skills: Object.fromEntries(
          uniqueSorted(skillRegistryEntries.keys()).map((registryId) => {
            const entry = skillRegistryEntries.get(registryId)!;
            return [
              registryId,
              {
                ...(entry.source ? { source: entry.source } : {}),
                ...(entry.sourceByProfile ? { sourceByProfile: entry.sourceByProfile } : {}),
                ...(entry.domains ? { domains: entry.domains } : {}),
              },
            ];
          }),
        ),
      },
      null,
      2,
    ),
  );
  setTextFile(
    filesMap,
    ".agents/registry/rules.json",
    JSON.stringify(
      {
        version: 1,
        rules: Object.fromEntries(
          uniqueSorted(ruleRegistryEntries.keys()).map((registryId) => {
            const entry = ruleRegistryEntries.get(registryId)!;
            return [
              registryId,
              {
                ...(entry.source ? { source: entry.source } : {}),
                ...(entry.sourceByProfile ? { sourceByProfile: entry.sourceByProfile } : {}),
                ...(entry.domains ? { domains: entry.domains } : {}),
              },
            ];
          }),
        ),
      },
      null,
      2,
    ),
  );
  setTextFile(
    filesMap,
    ".agents/registry/roles.json",
    JSON.stringify(
      {
        version: 1,
        roles: Object.fromEntries(
          uniqueSorted(Object.keys(rolesRegistry)).map((slug) => [slug, rolesRegistry[slug]]),
        ),
      },
      null,
      2,
    ),
  );
  setTextFile(
    filesMap,
    ".agents/registry/scenario-packages.json",
    JSON.stringify(
      {
        version: 1,
        scenario_packages: Object.fromEntries(
          uniqueSorted(Object.keys(scenariosRegistry)).map((slug) => [slug, scenariosRegistry[slug]]),
        ),
      },
      null,
      2,
    ),
  );
  setTextFile(filesMap, "manifest.json", JSON.stringify(manifest, null, 2));

  const report: BrAiSpecExportReport = {
    generatedAt: new Date().toISOString(),
    manifest,
    warnings,
    assets: {
      roles: roleReports.sort((a, b) => a.hubSlug.localeCompare(b.hubSlug)),
      skills: skillReports.sort((a, b) => a.hubSlug.localeCompare(b.hubSlug)),
      rules: ruleReports.sort((a, b) => a.hubSlug.localeCompare(b.hubSlug)),
      scenarios: scenarioReports.sort((a, b) => a.hubSlug.localeCompare(b.hubSlug)),
    },
  };
  setTextFile(filesMap, "export-report.json", JSON.stringify(report, null, 2));

  return {
    manifest,
    warnings,
    report,
    files: Array.from(filesMap.entries())
      .map(([path, content]) => ({ path, content }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
}

export async function buildBrAiSpecExportZip(
  input: InstallPreviewInput,
): Promise<BrAiSpecExportBundle & { bytes: Uint8Array }> {
  const bundle = await buildBrAiSpecExportBundle(input);
  const bytes = await buildZip(bundle.files);
  return {
    ...bundle,
    bytes,
  };
}
