import { HubError } from "./errors";

export const AUDIT_LOG_ERROR = {
  privacyViolated(message = "审计日志包含敏感字段") {
    return new HubError("AUDIT_LOG_PRIVACY_VIOLATED", message, "请移除 sourceCode、rawPrompt、rawResponse、绝对路径或密钥字段。", 400);
  },
  createFailed(message = "审计日志写入失败") {
    return new HubError("AUDIT_LOG_CREATE_FAILED", message, "请检查审计日志仓储和数据库连接状态。", 500);
  },
  queryFailed(message = "审计日志查询失败") {
    return new HubError("AUDIT_LOG_QUERY_FAILED", message, "请检查查询参数和审计日志仓储状态。", 500);
  },
  invalidQuery(message = "审计日志查询参数不合法") {
    return new HubError("INVALID_AUDIT_LOG_QUERY", message, "page 必须大于 0，pageSize 必须在 1 到 100 之间。", 400);
  },
};
