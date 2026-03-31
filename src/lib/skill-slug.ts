import { randomBytes } from "crypto";
import GitHubSlugger from "github-slugger";

/**
 * github-slugger v2 会保留中文等 Unicode，放进 URL 路径后易出现编码不一致、部分网关异常，表现为详情 404。
 * 仅接受 ASCII 段（与常见 URL slug 一致）；否则回退为随机 id（库内仍用 name 展示中文标题）。
 */
const ASCII_URL_SLUG = /^[a-z0-9._-]+$/;

export function slugFromName(name: string, fallbackPrefix = "skill"): string {
  const slugger = new GitHubSlugger();
  const base = slugger.slug(name.trim());
  if (base && ASCII_URL_SLUG.test(base)) return base;
  return `${fallbackPrefix}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}
