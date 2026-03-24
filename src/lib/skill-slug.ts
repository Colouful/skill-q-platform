import GitHubSlugger from "github-slugger";

/** 由名称生成 URL slug；若为空则回退为随机后缀 */
export function slugFromName(name: string): string {
  const slugger = new GitHubSlugger();
  const base = slugger.slug(name.trim());
  if (base) return base;
  return `skill-${Date.now().toString(36)}`;
}
