export type SkillFileEntry = { name: string; path: string; content: string };

/** 将版本 JSON 中的 files 转为编辑器可用的条目列表 */
export function parseVersionFilesJson(files: unknown): SkillFileEntry[] {
  if (!Array.isArray(files)) return [];
  const out: SkillFileEntry[] = [];
  for (const x of files) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    if (typeof o.path !== "string" || !o.path.trim()) continue;
    const path = o.path.replace(/\\/g, "/").replace(/^\/+/, "");
    const name =
      typeof o.name === "string" && o.name.trim()
        ? o.name.trim()
        : path.split("/").pop() || path;
    out.push({
      name,
      path,
      content: typeof o.content === "string" ? o.content : "",
    });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** 根据当前最新版本号建议下一补丁版本 */
export function suggestNextPatchVersion(current: string): string {
  const m = current.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return "1.0.1";
  const patch = parseInt(m[3], 10) + 1;
  return `${m[1]}.${m[2]}.${patch}`;
}

export function languageFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "javascript";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  return "plaintext";
}
