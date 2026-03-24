import JSZip from "jszip";
import { isRuleManifestPath, normalizeZipEntryPath } from "@/lib/rule-manifest-path";
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

/** 解压 Rule ZIP、校验路径与大小、解析 RULE.md（frontmatter 同 SKILL.md） */
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
      if (isRuleManifestPath(normalized)) {
        issues.push(
          `检测到 RULE 主说明文件但超过 ${MAX_SINGLE_FILE / 1024 / 1024}MB 限制已跳过：${normalized}（请压缩正文或拆分附件）`,
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

  const ruleFile = files.find((f) => isRuleManifestPath(f.path));
  let meta: Record<string, string> = {};
  let body = "";
  if (ruleFile) {
    const p = parseSkillMd(ruleFile.content);
    meta = p.meta;
    body = p.body;
  } else {
    const hint = issues.some((m) => m.includes("RULE 主说明文件但超过"))
      ? "（若上方提示主文件超大，请先缩小 RULE.md 再打包）"
      : "";
    issues.push(
      `未找到 RULE.md（或 RULE.md.txt）。请保证 ZIP 内存在名为 rule.md / RULE.md 的文件，可在任意子目录；需与 SKILL 包区分故约定此文件名。${hint}`,
    );
  }

  const hints = metaToRuleHints(meta);

  return {
    files,
    ruleMdPath: ruleFile?.path ?? null,
    meta,
    body,
    hints,
    issues,
  };
}
