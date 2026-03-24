import JSZip from "jszip";
import { metaToSkillHints, parseSkillMd } from "@/lib/skill-md-parse";
import { scanSkillZipForRiskPatterns } from "@/lib/skill-zip-security-scan";

const MAX_FILES = 500;
const MAX_ZIP_BYTES = 10 * 1024 * 1024;
const MAX_UNCOMPRESSED = 15 * 1024 * 1024;
const MAX_SINGLE_FILE = 2 * 1024 * 1024;

export type ZipImportFile = { name: string; path: string; content: string };

export type SkillZipImportResult = {
  files: ZipImportFile[];
  skillMdPath: string | null;
  meta: Record<string, string>;
  body: string;
  hints: { name?: string; description?: string };
  issues: string[];
};

/** 13.3 / 13.4 / 13.5：解压 ZIP、校验路径与大小、解析 SKILL.md */
export async function importSkillZip(buffer: ArrayBuffer): Promise<SkillZipImportResult> {
  if (buffer.byteLength > MAX_ZIP_BYTES) {
    throw new Error(`ZIP 超过 ${MAX_ZIP_BYTES / 1024 / 1024}MB 限制`);
  }

  const zip = await JSZip.loadAsync(buffer);
  const issues: string[] = [];
  const files: ZipImportFile[] = [];
  let totalUncompressed = 0;

  const entries = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
  if (entries.length > MAX_FILES) {
    throw new Error(`文件数量超过 ${MAX_FILES} 个`);
  }

  for (const relPath of entries) {
    const normalized = relPath.replace(/\\/g, "/");
    if (normalized.includes("..") || normalized.startsWith("/")) {
      issues.push(`已跳过非法路径: ${relPath}`);
      continue;
    }
    const lower = normalized.toLowerCase();
    // 13.6 深度安全扫描可接入 agent-skills-tools；此处先做扩展名拦截
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

  for (const msg of scanSkillZipForRiskPatterns(files)) {
    issues.push(`安全提示: ${msg}`);
  }

  const skillFile = files.find((f) => /(^|\/)SKILL\.md$/i.test(f.path));
  let meta: Record<string, string> = {};
  let body = "";
  if (skillFile) {
    const p = parseSkillMd(skillFile.content);
    meta = p.meta;
    body = p.body;
  } else {
    issues.push("未找到 SKILL.md，请放在 ZIP 根目录或子目录中");
  }

  const hints = metaToSkillHints(meta);

  return {
    files,
    skillMdPath: skillFile?.path ?? null,
    meta,
    body,
    hints,
    issues,
  };
}
