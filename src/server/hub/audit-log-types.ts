export type HubAuditTargetType = "asset-version" | "manifest-version" | "agent-profile";

export type HubAuditAction =
  | "submit-review"
  | "reject"
  | "publish"
  | "deprecate"
  | "archive"
  | "bind"
  | "unbind"
  | "reorder"
  | "security-validate";

export type HubAuditLog = {
  id: string;
  targetType: HubAuditTargetType | string;
  targetId: string;
  targetSlug?: string;
  targetVersion?: string;
  action: HubAuditAction | string;
  operator?: string;
  operatorId?: string;
  operatorName?: string;
  operatorType?: string;
  reason?: string;
  note?: string;
  statusFrom?: string;
  statusTo?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
};
