export const CATALOG_PUBLISH_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export const ROLE_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  PLANNED: "planned",
} as const;

export type CatalogPublishStatus =
  (typeof CATALOG_PUBLISH_STATUS)[keyof typeof CATALOG_PUBLISH_STATUS];

export function isPublishedCatalogStatus(value: string | null | undefined): boolean {
  return (value ?? CATALOG_PUBLISH_STATUS.DRAFT) === CATALOG_PUBLISH_STATUS.PUBLISHED;
}

export function catalogPublishStatusLabel(value: string | null | undefined): string {
  switch (value) {
    case CATALOG_PUBLISH_STATUS.PUBLISHED:
      return "已发布";
    case CATALOG_PUBLISH_STATUS.DRAFT:
    default:
      return "草稿";
  }
}

export function roleStatusLabel(value: string | null | undefined): string {
  switch (value) {
    case ROLE_STATUS.ACTIVE:
      return "启用中";
    case ROLE_STATUS.PLANNED:
      return "规划中";
    case ROLE_STATUS.DRAFT:
    default:
      return "草稿";
  }
}

export function stringArrayFromJson(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
