import JSZip from "jszip";
import { load as parseYaml } from "js-yaml";
import { scanSkillZipForRiskPatterns } from "@/lib/skill-zip-security-scan";
import {
  isRoleManifestPath,
  isRoleMarkdownFilenamePath,
  normalizeRoleZipEntryPath,
} from "@/lib/role-manifest-path";
import { ROLE_STATUS } from "@/lib/catalog";

const MAX_FILES = 500;
const MAX_ZIP_BYTES = 10 * 1024 * 1024;
const MAX_UNCOMPRESSED = 15 * 1024 * 1024;
const MAX_SINGLE_FILE = 2 * 1024 * 1024;

export type RoleImportFile = { name: string; path: string; content: string };

export type RoleImportSections = {
  rolePositioning: string | null;
  workingPrinciples: string[];
  requiredSteps: string[];
  executionContract: string | null;
  outputStandard: string | null;
  prohibitedActions: string[];
  handoffNotes: string | null;
};

export type RoleImportResult = {
  files: RoleImportFile[];
  roleMdPath: string | null;
  meta: Record<string, unknown>;
  body: string;
  hints: { name?: string; description?: string; slug?: string; roleStatus?: string };
  sections: RoleImportSections;
  roleData: {
    slug: string;
    name: string;
    roleStatus: string;
    description: string;
    domains: string[];
    triggers: string[];
    preferredSkills: string[];
    reads: string[];
    writes: string[];
    handoffTo: string[];
  };
  ignoredMetaKeys: string[];
  issues: string[];
};

type RoleFrontmatter = {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  domains?: unknown;
  description?: unknown;
  triggers?: unknown;
  preferred_skills?: unknown;
  reads?: unknown;
  writes?: unknown;
  handoff_to?: unknown;
  [key: string]: unknown;
};

const KNOWN_META_KEYS = new Set([
  "id",
  "name",
  "status",
  "domains",
  "description",
  "triggers",
  "preferred_skills",
  "reads",
  "writes",
  "handoff_to",
]);

function splitFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const t = content.trimStart();
  if (!t.startsWith("---")) {
    return { meta: {}, body: content };
  }
  const match = t.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: content };
  }
  const parsed = parseYaml(match[1]) as Record<string, unknown> | null;
  return {
    meta: parsed && typeof parsed === "object" ? parsed : {},
    body: match[2] ?? "",
  };
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asTrimmedString).filter((item): item is string => !!item);
}

function normalizeRoleStatus(value: string | null, issues: string[]): string {
  const lower = value?.trim().toLowerCase() ?? "";
  if (lower === ROLE_STATUS.ACTIVE || lower === ROLE_STATUS.PLANNED || lower === ROLE_STATUS.DRAFT) {
    return lower;
  }
  if (lower) {
    issues.push(`未识别的专家状态「${lower}」，已按草稿处理`);
  }
  return ROLE_STATUS.DRAFT;
}

function normalizeHeadingTitle(value: string): string {
  return value.replace(/^[0-9]+\.\s*/, "").trim();
}

function extractSections(body: string): RoleImportSections {
  const sectionMap = new Map<string, string[]>();
  let currentTitle: string | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const heading = rawLine.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      currentTitle = normalizeHeadingTitle(heading[1] || "");
      if (!sectionMap.has(currentTitle)) sectionMap.set(currentTitle, []);
      continue;
    }
    if (!currentTitle) continue;
    sectionMap.get(currentTitle)?.push(rawLine);
  }

  const getText = (...titles: string[]): string | null => {
    for (const title of titles) {
      const lines = sectionMap.get(title);
      if (!lines) continue;
      const text = lines.join("\n").trim();
      if (text) return text;
    }
    return null;
  };

  const getList = (...titles: string[]): string[] => {
    const text = getText(...titles);
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean);
  };

  return {
    rolePositioning: getText("角色定位"),
    workingPrinciples: getList("工作原则"),
    requiredSteps: getList("必做步骤"),
    executionContract: getText("执行契约"),
    outputStandard: getText("输出标准"),
    prohibitedActions: getList("禁止事项"),
    handoffNotes: getText("交接说明", "交接"),
  };
}

function validateRoleTemplate(role: {
  slug: string | null;
  name: string | null;
  description: string | null;
  domains: string[];
  triggers: string[];
  preferredSkills: string[];
  reads: string[];
  writes: string[];
  handoffTo: string[];
}) {
  const hasCore =
    !!role.slug &&
    !!role.name &&
    !!role.description &&
    role.domains.length > 0 &&
    [
      role.triggers,
      role.preferredSkills,
      role.reads,
      role.writes,
      role.handoffTo,
    ].some((items) => items.length > 0);

  if (!hasCore) {
    throw new Error("这更像规范文档而非专家角色文件，请上传符合角色模板的 Markdown");
  }
}

function finalizeRoleImport(roleFile: RoleImportFile, allFiles: RoleImportFile[], issues: string[]): RoleImportResult {
  for (const msg of scanSkillZipForRiskPatterns(allFiles)) {
    issues.push(`安全提示: ${msg}`);
  }

  const { meta, body } = splitFrontmatter(roleFile.content);
  const frontmatter = meta as RoleFrontmatter;
  const slug = asTrimmedString(frontmatter.id);
  const name = asTrimmedString(frontmatter.name);
  const roleStatus = normalizeRoleStatus(asTrimmedString(frontmatter.status), issues);
  const description = asTrimmedString(frontmatter.description);
  const domains = asStringArray(frontmatter.domains);
  const triggers = asStringArray(frontmatter.triggers);
  const preferredSkills = asStringArray(frontmatter.preferred_skills);
  const reads = asStringArray(frontmatter.reads);
  const writes = asStringArray(frontmatter.writes);
  const handoffTo = asStringArray(frontmatter.handoff_to);

  validateRoleTemplate({
    slug,
    name,
    description,
    domains,
    triggers,
    preferredSkills,
    reads,
    writes,
    handoffTo,
  });

  const sections = extractSections(body);
  const ignoredMetaKeys = Object.keys(frontmatter).filter((key) => !KNOWN_META_KEYS.has(key));

  return {
    files: allFiles,
    roleMdPath: roleFile.path,
    meta,
    body,
    hints: {
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      ...(slug ? { slug } : {}),
      ...(roleStatus ? { roleStatus } : {}),
    },
    sections,
    roleData: {
      slug: slug || "",
      name: name || "",
      roleStatus,
      description: description || "",
      domains,
      triggers,
      preferredSkills,
      reads,
      writes,
      handoffTo,
    },
    ignoredMetaKeys,
    issues,
  };
}

export function importRoleMarkdownFile(buffer: ArrayBuffer, originalFileName: string): RoleImportResult {
  const issues: string[] = [];
  if (buffer.byteLength > MAX_SINGLE_FILE) {
    throw new Error(`Markdown 超过 ${MAX_SINGLE_FILE / 1024 / 1024}MB 限制`);
  }
  const baseName = originalFileName.replace(/\\/g, "/").split("/").pop() || originalFileName;
  if (!/\.md$/i.test(baseName)) {
    throw new Error("请上传扩展名为 .md 的 Markdown 文件");
  }
  const normalized = normalizeRoleZipEntryPath(baseName);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer));
  const files: RoleImportFile[] = [{ name: baseName, path: normalized, content: text }];
  return finalizeRoleImport(files[0]!, files, issues);
}

function pickRoleMarkdownSource(files: RoleImportFile[], issues: string[]): RoleImportFile | null {
  const byManifest = files.find((f) => isRoleManifestPath(f.path));
  if (byManifest) return byManifest;

  const mdOnly = files.filter((f) => isRoleMarkdownFilenamePath(f.path));
  if (mdOnly.length === 1) {
    issues.push(`已使用唯一 Markdown 文件「${mdOnly[0]!.path}」作为专家说明`);
    return mdOnly[0]!;
  }
  if (mdOnly.length > 1) {
    issues.push("ZIP 内存在多个 .md 文件，请仅保留一个主专家文件，或将其命名为 ROLE.md / role.md");
    return null;
  }
  return null;
}

export async function importRoleZip(buffer: ArrayBuffer): Promise<RoleImportResult> {
  if (buffer.byteLength > MAX_ZIP_BYTES) {
    throw new Error(`ZIP 超过 ${MAX_ZIP_BYTES / 1024 / 1024}MB 限制`);
  }

  const zip = await JSZip.loadAsync(buffer);
  const issues: string[] = [];
  const files: RoleImportFile[] = [];
  let totalUncompressed = 0;

  const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  if (entries.length > MAX_FILES) {
    throw new Error(`文件数量超过 ${MAX_FILES} 个`);
  }

  for (const relPath of entries) {
    const normalized = normalizeRoleZipEntryPath(relPath);
    if (normalized.includes("..") || normalized.startsWith("/")) {
      issues.push(`已跳过非法路径: ${relPath}`);
      continue;
    }
    const lower = normalized.toLowerCase();
    if (lower.endsWith(".exe") || lower.endsWith(".bat") || lower.endsWith(".cmd")) {
      issues.push(`已跳过可执行文件: ${relPath}`);
      continue;
    }

    const entry = zip.files[relPath];
    const buf = await entry.async("uint8array");
    if (buf.length > MAX_SINGLE_FILE) {
      issues.push(`已跳过大文件: ${relPath}`);
      continue;
    }
    totalUncompressed += buf.length;
    if (totalUncompressed > MAX_UNCOMPRESSED) {
      throw new Error("解压后总大小超过限制（防 Zip 炸弹）");
    }

    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const name = normalized.split("/").pop() || normalized;
    files.push({ name, path: normalized, content: text });
  }

  const roleFile = pickRoleMarkdownSource(files, issues);
  if (!roleFile) {
    throw new Error("未找到可用的专家 Markdown，请检查 ZIP 内主文件");
  }

  return finalizeRoleImport(roleFile, files, issues);
}
