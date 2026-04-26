import { describe, expect, it } from "vitest";
import { AuditLogService } from "@/server/hub/audit-log-service";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

function createService() {
  return new AuditLogService(new InMemoryHubRepositoryAdapter());
}

describe("AuditLog privacy", () => {
  it.each([
    ["sourceCode", { sourceCode: "const secret = 1" }],
    ["rawPrompt", { rawPrompt: "prompt" }],
    ["rawResponse", { rawResponse: "response" }],
    ["/Users/ 绝对路径", { path: "/Users/lizhenwei/private/project" }],
    ["嵌套 token", { nested: { token: "secret-token" } }],
    [".env 内容", { config: "DATABASE_URL=mysql://user:pass@host/db" }],
  ])("metadata 包含 %s 时应拒绝写入", async (_name, metadata) => {
    const service = createService();

    await expect(service.createAuditLog({
      targetType: "asset-version",
      targetId: "version-1",
      action: "submit-review",
      metadata,
    })).rejects.toMatchObject({ code: "AUDIT_LOG_PRIVACY_VIOLATED" });
  });
});
