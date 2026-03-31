import { randomBytes } from "crypto";
import GitHubSlugger from "github-slugger";

export const ASCII_URL_SLUG = /^[a-z0-9._-]+$/;

export function slugFromCatalogName(name: string, fallbackPrefix: string): string {
  const slugger = new GitHubSlugger();
  const base = slugger.slug(name.trim());
  if (base && ASCII_URL_SLUG.test(base)) return base;
  return `${fallbackPrefix}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;
}

export function normalizeCatalogSlug(raw: string, fallbackPrefix: string): string {
  const trimmed = raw.trim();
  if (trimmed && ASCII_URL_SLUG.test(trimmed)) return trimmed;
  return slugFromCatalogName(trimmed || fallbackPrefix, fallbackPrefix);
}

export function sanitizeCatalogSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
