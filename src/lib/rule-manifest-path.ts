/**
 * Rule 包「主说明文件」路径识别（与 SKILL.md 对称，便于工具与评测一致）。
 * - 必须匹配：文件名主体为 rule.md（大小写不敏感），可在任意子目录。
 * - 额外接受：Windows 另存为常变成 `RULE.md.txt`（仍视为同一入口）。
 */
export function normalizeZipEntryPath(relPath: string): string {
  return relPath.replace(/\\/g, "/").replace(/^\.\//, "").trim();
}

/** 是否为 Rule 主清单文件路径（不含「是否成功读入」） */
export function isRuleManifestPath(normalizedPath: string): boolean {
  return /(^|\/)rule\.md(\.txt)?$/i.test(normalizedPath);
}

const MD_BASENAME = /\.md$/i;

/** 路径末段是否为 .md（任意名称，如 coding-style.md） */
export function isMarkdownFilenamePath(normalizedPath: string): boolean {
  const seg = normalizeZipEntryPath(normalizedPath).split("/").pop() || "";
  return MD_BASENAME.test(seg);
}

/**
 * 可作为 Rule 主说明的 Markdown 路径：约定名 RULE.md / RULE.md.txt，或任意 *.md。
 */
export function isRulePrimaryMarkdownPath(normalizedPath: string): boolean {
  return isRuleManifestPath(normalizedPath) || isMarkdownFilenamePath(normalizedPath);
}
