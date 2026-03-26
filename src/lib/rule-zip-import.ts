import JSZip from "jszip";
import {
  isMarkdownFilenamePath,
  isRuleManifestPath,
  isRulePrimaryMarkdownPath,
  normalizeZipEntryPath,
} from "@/lib/rule-manifest-path";
import { metaToRuleHints, parseSkillMd } from "@/lib/skill-md-parse";
import { scanSkillZipForRiskPatterns } from "@/lib/skill-zip-security-scan";

const MAX_FILES = 500;
const MAX_ZIP_BYTES = 10 * 1024 * 1024;
const MAX_UNCOMPRESSED = 15 * 1024 * 1024;
const MAX_SINGLE_FILE = 2 * 1024 * 1024;

export type ZipImportFile = { name: string; path: string; content: string };

export type RuleZipImportResult = {
  files: ZipImportFile[];
  ruleMdPath: string | null;
  meta: Record<string, string>;
  body: string;
  hints: { name?: string; description?: string };
  issues: string[];
};

function pickRuleMarkdownSource(files: ZipImportFile[], issues: string[]): ZipImportFile | null {
  const byManifest = files.find((f) => isRuleManifestPath(f.path));
  if (byManifest) return byManifest;

  const mdOnly = files.filter((f) => isMarkdownFilenamePath(f.path));
  if (mdOnly.length === 1) {
    issues.push(`已使用唯一 Markdown 文件「${mdOnly[0]!.path}」作为规则说明`);
    return mdOnly[0]!;
  }
  if (mdOnly.length > 1) {
    issues.push(
      "ZIP 内存在多个 .md 文件，请只保留一个主说明，或将其命名为 RULE.md / rule.md 以明确入口",
    );
    return null;
  }
  return null;
}

function finalizeRuleImportFromMarkdown(
  ruleFile: ZipImportFile,
  allFiles: ZipImportFile[],
  issues: string[],
): RuleZipImportResult {
  const p = parseSkillMd(ruleFile.content);
  const hints = metaToRuleHints(p.meta);
  return {
    files: allFiles,
    ruleMdPath: ruleFile.path,
    meta: p.meta,
    body: p.body,
    hints,
    issues,
  };
}

/** 单文件 .md 上传（任意文件名，frontmatter 同 SKILL.md） */
export function importRuleMarkdownFile(buffer: ArrayBuffer, originalFileName: string): RuleZipImportResult {
  const issues: string[] = [];
  if (buffer.byteLength > MAX_SINGLE_FILE) {
    throw new Error(`Markdown 超过 ${MAX_SINGLE_FILE / 1024 / 1024}MB 限制`);
  }
  const baseName = originalFileName.replace(/\\/g, "/").split("/").pop() || originalFileName;
  if (!/\.md$/i.test(baseName)) {
    throw new Error("请上传扩展名为 .md 的 Markdown 文件");
  }
  const normalized = normalizeZipEntryPath(baseName);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer));
  const files: ZipImportFile[] = [{ name: baseName, path: normalized, content: text }];

  for (const msg of scanSkillZipForRiskPatterns(files)) {
    issues.push(`安全提示: ${msg}`);
  }

  return finalizeRuleImportFromMarkdown(files[0]!, files, issues);
}

/** 解压 Rule ZIP、校验路径与大小；主说明为 RULE.md，或 ZIP 内唯一的 .md 文件（frontmatter 同 SKILL.md） */
export async function importRuleZip(buffer: ArrayBuffer): Promise<RuleZipImportResult> {
  if (buffer.byteLength > MAX_ZIP_BYTES) {
    throw new Error(`ZIP 超过 ${MAX_ZIP_BYTES / 1024 / 1024}MB 限制`);
  }

  const zip = await JSZip.loadAsync(buffer);
  const issues: string[] = [];
  /** 按小写路径去重，后者覆盖前者（避免 ZIP 内重复条目导致「有文件却找不到」） */
  const fileByLowerPath = new Map<string, ZipImportFile>();
  let totalUncompressed = 0;

  const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  if (entries.length > MAX_FILES) {
    throw new Error(`文件数量超过 ${MAX_FILES} 个`);
  }

  for (const relPath of entries) {
    const normalized = normalizeZipEntryPath(relPath);
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
      if (isRulePrimaryMarkdownPath(normalized)) {
        issues.push(
          `检测到 Rule 主 Markdown 但超过 ${MAX_SINGLE_FILE / 1024 / 1024}MB 限制已跳过：${normalized}（请压缩正文或拆分附件）`,
        );
      } else {
        issues.push(`已跳过大文件: ${relPath}`);
      }
      continue;
    }
    totalUncompressed += buf.length;
    if (totalUncompressed > MAX_UNCOMPRESSED) {
      throw new Error("解压后总大小超过限制（防 Zip 炸弹）");
    }

    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const name = normalized.split("/").pop() || normalized;
    const key = normalized.toLowerCase();
    if (fileByLowerPath.has(key)) {
      issues.push(`ZIP 内路径重复（忽略大小写，已保留后出现的文件）: ${normalized}`);
    }
    fileByLowerPath.set(key, { name, path: normalized, content: text });
  }

  const files = Array.from(fileByLowerPath.values());

  for (const msg of scanSkillZipForRiskPatterns(files)) {
    issues.push(`安全提示: ${msg}`);
  }

  const ruleFile = pickRuleMarkdownSource(files, issues);
  if (!ruleFile) {
    const hint = issues.some((m) => m.includes("主 Markdown 但超过"))
      ? "（若上方提示主文件超大，请先缩小正文再上传）"
      : "";
    if (!issues.some((m) => m.includes("多个 .md"))) {
      issues.push(
        `未找到可用的 Rule 说明：请放入至少一个 .md 文件，或将主文件命名为 RULE.md / rule.md（可在子目录）。${hint}`,
      );
    }
    return {
      files,
      ruleMdPath: null,
      meta: {},
      body: "",
      hints: {},
      issues,
    };
  }

  return finalizeRuleImportFromMarkdown(ruleFile, files, issues);
}
