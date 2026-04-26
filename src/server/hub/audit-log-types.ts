export type HubAuditTargetType = "asset-version" | "manifest-version" | "agent-profile";

export type HubAuditAction = "submit-review" | "reject" | "publish" | "deprecate" | "archive";

export type HubAuditLog = {
  id: string;
  targetType: HubAuditTargetType;
  targetId: string;
  action: HubAuditAction;
  operator: string;
  reason?: string;
  note?: string;
  statusFrom?: string;
  statusTo?: string;
  createdAt: string;
};
