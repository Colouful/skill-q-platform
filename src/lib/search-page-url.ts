import type { UnifiedSearchType } from "@/lib/unified-search";

/** 全局搜索落地页 URL */
export function searchPageHref(q: string, type: UnifiedSearchType) {
  const params = new URLSearchParams();
  const v = q.trim();
  if (v) params.set("q", v);
  if (type !== "all") params.set("type", type);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
