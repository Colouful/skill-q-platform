import { AUDIT_LOG_ERROR } from "./audit-log-errors";

const FORBIDDEN_KEYS = new Set([
  "sourceCode",
  "source_code",
  "sourceContent",
  "source_content",
  "fileContent",
  "file_content",
  "rawPrompt",
  "raw_prompt",
  "rawResponse",
  "raw_response",
  "absolutePath",
  "absolute_path",
  "apiKey",
  "api_key",
  "password",
  "token",
  "secret",
]);

function isAbsolutePath(value: string) {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}

function containsEnvContent(value: string) {
  return value.includes(".env") || /^[A-Z0-9_]+=.*/m.test(value);
}

export function assertSafeAuditLogPayload(value: unknown) {
  const visit = (item: unknown, path: string) => {
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    if (!item || typeof item !== "object") {
      if (typeof item === "string") {
        if (isAbsolutePath(item) || item.includes("/Users/")) {
          throw AUDIT_LOG_ERROR.privacyViolated("审计日志 metadata 不允许包含绝对路径");
        }
        if (containsEnvContent(item)) {
          throw AUDIT_LOG_ERROR.privacyViolated("审计日志 metadata 不允许包含 .env 或环境变量内容");
        }
      }
      return;
    }
    for (const [key, child] of Object.entries(item as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw AUDIT_LOG_ERROR.privacyViolated(`审计日志 metadata 不允许包含 ${key}`);
      }
      visit(child, path ? `${path}.${key}` : key);
    }
  };
  visit(value, "");
}
