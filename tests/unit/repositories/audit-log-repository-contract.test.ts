import { describe, expect, it } from "vitest";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

describe("AuditLogRepository contract", () => {
  it("InMemory AuditLog Repository 应支持写入、分页和筛选", async () => {
    const repository = new InMemoryHubRepositoryAdapter();

    await repository.createAuditLog({
      targetType: "asset-version",
      targetId: "version-1",
      targetSlug: "asset-a",
      targetVersion: "1.0.0",
      action: "submit-review",
      statusFrom: "draft",
      statusTo: "reviewing",
      operatorId: "editor-1",
      operatorName: "编辑员",
      metadata: { source: "unit-test" },
    });
    await repository.createAuditLog({
      targetType: "manifest-version",
      targetId: "manifest-version-1",
      action: "publish",
      operatorId: "reviewer-1",
    });

    await expect(repository.listAuditLogs({ page: 1, pageSize: 1 })).resolves.toMatchObject({
      pagination: { page: 1, pageSize: 1, total: 2 },
    });
    await expect(repository.listAuditLogs({ targetType: "asset-version" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ targetId: "version-1", operatorId: "editor-1" }],
    });
    await expect(repository.listAuditLogs({ action: "publish" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ targetType: "manifest-version" }],
    });
    await expect(repository.listAuditLogs({ operatorId: "reviewer-1" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "publish" }],
    });
  });

  it("InMemory AuditLog Repository 应拒绝敏感 metadata", async () => {
    const repository = new InMemoryHubRepositoryAdapter();

    await expect(repository.createAuditLog({
      targetType: "asset-version",
      targetId: "version-1",
      action: "submit-review",
      metadata: { nested: { rawResponse: "secret" } },
    })).rejects.toMatchObject({ code: "AUDIT_LOG_PRIVACY_VIOLATED" });
  });
});
