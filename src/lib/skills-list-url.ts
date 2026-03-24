/** 构建 /skills 列表 URL，统一保留 q、category、page */
export function skillsListHref(opts: {
  q?: string;
  category?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  const q = opts.q?.trim();
  const category = opts.category?.trim();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (opts.page != null && opts.page > 1) params.set("page", String(opts.page));
  const s = params.toString();
  return s ? `/skills?${s}` : "/skills";
}
