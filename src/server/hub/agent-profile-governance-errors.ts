import { HubError } from "./errors";

export const AGENT_PROFILE_ERROR = {
  notFound: () => new HubError("AGENT_PROFILE_NOT_FOUND", "Agent Profile 不存在", "请确认 profileId 是否正确。", 404),
  versionExists: () =>
    new HubError("AGENT_PROFILE_VERSION_ALREADY_EXISTS", "Agent Profile 版本已存在", "请更换 slug 或 version 后重试。", 409),
  createInvalid: (message = "Agent Profile 创建参数不合法") =>
    new HubError("AGENT_PROFILE_CREATE_INVALID", message, "请检查 slug、name、version 和 content。", 400),
  updateNotAllowed: () =>
    new HubError("AGENT_PROFILE_UPDATE_NOT_ALLOWED", "当前 Agent Profile 状态不允许修改", "只有 draft 或 rejected 状态可以修改。", 409),
  archived: () => new HubError("AGENT_PROFILE_ARCHIVED", "Agent Profile 已归档", "已归档 Agent Profile 不允许修改。", 409),
  publishNotAllowed: () =>
    new HubError("AGENT_PROFILE_PUBLISH_NOT_ALLOWED", "当前 Agent Profile 状态不允许发布", "只有 draft 或 reviewing 状态可以发布。", 409),
  deprecateNotAllowed: () =>
    new HubError("AGENT_PROFILE_DEPRECATE_NOT_ALLOWED", "当前 Agent Profile 状态不允许废弃", "只有 published 状态可以废弃。", 409),
  securityInvalid: (message = "Agent Profile 安全策略不合法") =>
    new HubError("AGENT_PROFILE_SECURITY_POLICY_INVALID", message, "请修正 deniedTools、contextScope 和 approvalPolicy。", 400),
  exportNotAllowed: () =>
    new HubError("AGENT_PROFILE_EXPORT_NOT_ALLOWED", "Agent Profile 当前状态不允许导出", "只有 published 状态可以导出。", 409),
  checksumRequired: () =>
    new HubError("CHECKSUM_REQUIRED", "Agent Profile checksum 不能为空", "请重新生成 checksum 后再发布。", 400),
  contentRequired: () => new HubError("CONTENT_REQUIRED", "Agent Profile content 不能为空", "请补充完整 content。", 400),
  invalidPagination: () =>
    new HubError("INVALID_PAGINATION", "分页参数不合法", "page 必须大于 0，pageSize 必须在 1 到 100 之间。", 400),
  invalidExecutor: () =>
    new HubError("INVALID_AGENT_EXECUTOR", "Agent Profile defaultExecutor 不合法", "请使用 cursor、codex 或 claude-code。", 400),
  invalidStatus: () =>
    new HubError("INVALID_AGENT_PROFILE_STATUS", "Agent Profile 状态不合法", "请使用平台支持的 Agent Profile 状态。", 400),
};
