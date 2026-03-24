import {
  runUnifiedSearch,
  type UnifiedSearchType,
  type SkillWithCategory,
  type RuleWithCategory,
} from "@/lib/unified-search";

type CacheEntry = { expires: number; data: { skills: SkillWithCategory[]; rules: RuleWithCategory[] } };

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 30_000;

function key(q: string, type: UnifiedSearchType) {
  return `${type}:${q.trim().toLowerCase()}`;
}

/** 统一搜索短期内存缓存（减轻 DB 压力；多实例不一致可接受） */
export async function runUnifiedSearchCached(
  q: string,
  type: UnifiedSearchType,
  ttlMs = DEFAULT_TTL_MS,
): Promise<{ skills: SkillWithCategory[]; rules: RuleWithCategory[] }> {
  const trimmed = q.trim();
  if (!trimmed) {
    return runUnifiedSearch("", type);
  }
  const k = key(trimmed, type);
  const now = Date.now();
  const hit = store.get(k);
  if (hit && hit.expires > now) {
    return hit.data;
  }
  const data = await runUnifiedSearch(trimmed, type);
  store.set(k, { expires: now + ttlMs, data });
  return data;
}
