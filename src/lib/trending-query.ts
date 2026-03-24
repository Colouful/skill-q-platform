import type { Prisma } from "@/generated/prisma";

export type TrendingResourceType = "all" | "skill" | "rule";
export type TrendingSort = "downloads" | "rating" | "recent";
export type TrendingLimit = 10 | 50 | 100;

export function parseTrendingParams(sp: {
  type?: string;
  limit?: string;
  sort?: string;
}): {
  type: TrendingResourceType;
  limit: TrendingLimit;
  sort: TrendingSort;
} {
  const tr = sp.type?.trim().toLowerCase();
  /** 默认 Skill 单轨，避免与 Rule 混在同一屏；显式 ?type=all 才双轨合并 */
  const type: TrendingResourceType =
    tr === "rule" ? "rule" : tr === "all" ? "all" : "skill";

  const ln = Number.parseInt(sp.limit ?? "50", 10);
  const limit: TrendingLimit = ln === 10 || ln === 100 ? ln : 50;

  const sr = sp.sort?.trim().toLowerCase();
  const sort: TrendingSort =
    sr === "rating" || sr === "recent" ? sr : "downloads";

  return { type, limit, sort };
}

export function skillOrderBy(sort: TrendingSort): Prisma.SkillOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }, { updatedAt: "desc" }];
    case "recent":
      return [{ updatedAt: "desc" }, { downloads: "desc" }];
    default:
      return [{ downloads: "desc" }, { updatedAt: "desc" }];
  }
}

export function ruleOrderBy(sort: TrendingSort): Prisma.RuleOrderByWithRelationInput[] {
  switch (sort) {
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }, { updatedAt: "desc" }];
    case "recent":
      return [{ updatedAt: "desc" }, { downloads: "desc" }];
    default:
      return [{ downloads: "desc" }, { updatedAt: "desc" }];
  }
}

/** 构建 /trending 查询串（省略与默认相同的参数） */
export function trendingHref(
  current: {
    type: TrendingResourceType;
    limit: TrendingLimit;
    sort: TrendingSort;
  },
  patch: Partial<{
    type: TrendingResourceType;
    limit: TrendingLimit;
    sort: TrendingSort;
  }> = {},
) {
  const type = patch.type ?? current.type;
  const limit = patch.limit ?? current.limit;
  const sort = patch.sort ?? current.sort;

  const p = new URLSearchParams();
  if (type === "rule") p.set("type", "rule");
  else if (type === "all") p.set("type", "all");
  if (limit !== 50) p.set("limit", String(limit));
  if (sort !== "downloads") p.set("sort", sort);
  const qs = p.toString();
  return qs ? `/trending?${qs}` : "/trending";
}
