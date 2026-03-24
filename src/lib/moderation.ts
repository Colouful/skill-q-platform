/** 与 Prisma `moderationStatus` 一致 */
export const MODERATION_STATUS = {
  PUBLISHED: "published",
  PENDING: "pending",
  REJECTED: "rejected",
} as const;

export type ModerationStatusValue = (typeof MODERATION_STATUS)[keyof typeof MODERATION_STATUS];

export function isPublishedModeration(s: string | null | undefined): boolean {
  return (s ?? MODERATION_STATUS.PUBLISHED) === MODERATION_STATUS.PUBLISHED;
}

/** 未上架资源仅作者本人可浏览（管理员在后台用列表 API 处理，不依赖前台详情）。 */
export function canViewUnpublishedResource(
  moderationStatus: string | null | undefined,
  authorAgentId: string | null | undefined,
  viewerAgentId: string | null | undefined,
): boolean {
  if (isPublishedModeration(moderationStatus)) return true;
  return Boolean(viewerAgentId && authorAgentId && viewerAgentId === authorAgentId);
}
