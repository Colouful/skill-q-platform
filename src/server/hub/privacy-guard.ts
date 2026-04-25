import { HubError } from "./errors";

const FORBIDDEN_KEYS = new Set([
  "sourceCode",
  "source_code",
  "fileContent",
  "file_content",
  "rawPrompt",
  "raw_prompt",
  "rawResponse",
  "raw_response",
]);

function isAbsolutePath(value: string) {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}

export function assertNoSensitivePayload(value: unknown, options: { allowRawPrompt?: boolean; allowRawResponse?: boolean } = {}) {
  const visit = (item: unknown, path: string) => {
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    if (!item || typeof item !== "object") {
      if (typeof item === "string" && isAbsolutePath(item)) {
        throw new HubError("PRIVACY_VIOLATION", "请求中包含绝对路径", "请只上传相对路径或结构化摘要。", 400);
      }
      return;
    }
    for (const [key, child] of Object.entries(item as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) {
        if ((key === "rawPrompt" || key === "raw_prompt") && options.allowRawPrompt) continue;
        if ((key === "rawResponse" || key === "raw_response") && options.allowRawResponse) continue;
        throw new HubError("PRIVACY_VIOLATION", `请求中不允许包含 ${key}`, "请移除源码、rawPrompt、rawResponse 或文件正文。", 400);
      }
      visit(child, path ? `${path}.${key}` : key);
    }
  };
  visit(value, "");
}
