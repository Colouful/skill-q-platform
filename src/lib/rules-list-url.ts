/** 构建 /rules 列表 URL */
export function rulesListHref(opts: {
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
  return s ? `/rules?${s}` : "/rules";
}
