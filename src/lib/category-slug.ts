/** 分类 slug：trim、空白转连字符（保留中文等用于站内路径，最长 50） */
export function normalizeCategorySlug(raw: string): string {
  return raw.trim().replace(/\s+/g, "-").slice(0, 50);
}
