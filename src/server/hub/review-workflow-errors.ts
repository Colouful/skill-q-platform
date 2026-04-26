import { HubError } from "./errors";

export const REVIEW_ERROR = {
  targetNotFound: () =>
    new HubError("REVIEW_TARGET_NOT_FOUND", "审核目标不存在", "请刷新页面后重新选择需要审核的资源。", 404),
  submitNotAllowed: () =>
    new HubError("REVIEW_SUBMIT_NOT_ALLOWED", "当前状态不允许提交审核", "只有 draft 或 rejected 状态可以提交审核。", 409),
  rejectNotAllowed: () =>
    new HubError("REVIEW_REJECT_NOT_ALLOWED", "当前状态不允许驳回", "只有 reviewing 状态可以驳回。", 409),
  reasonRequired: () =>
    new HubError("REVIEW_REASON_REQUIRED", "驳回原因不能为空", "请输入明确的中文驳回原因。", 400),
  publishNotAllowed: () =>
    new HubError("REVIEW_PUBLISH_NOT_ALLOWED", "当前状态不允许发布", "请先提交审核，并确认发布前检查通过。", 409),
  auditLogFailed: () =>
    new HubError("REVIEW_AUDIT_LOG_FAILED", "审计日志写入失败", "请稍后重试或联系管理员。", 500),
  invalidTargetType: () =>
    new HubError("INVALID_REVIEW_TARGET_TYPE", "审核目标类型不合法", "请使用 asset-version、manifest-version 或 agent-profile。", 400),
  invalidStatus: () =>
    new HubError("INVALID_REVIEW_STATUS", "审核状态不合法", "请检查目标资源状态。", 400),
  immutable: () =>
    new HubError("PUBLISHED_RESOURCE_IMMUTABLE", "已发布资源不可直接修改", "请创建新版本后重新提交审核。", 409),
  archivedLocked: () =>
    new HubError("ARCHIVED_RESOURCE_LOCKED", "已归档资源不允许进入审核流程", "请选择未归档资源。", 409),
};
