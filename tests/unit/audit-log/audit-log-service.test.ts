import { describe, expect, it } from "vitest";
import { AuditLogService } from "@/server/hub/audit-log-service";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

function createService() {
  return new AuditLogService(new InMemoryHubRepositoryAdapter());
}

describe("AuditLogService", () => {
  it("应写入审计日志并按分页查询", async () => {
    const service = createService();

    await service.createAuditLog({
      targetType: "asset-version",
      targetId: "asset-version-1",
      action: "submit-review",
      statusFrom: "draft",
      statusTo: "reviewing",
      operatorId: "system",
      operatorName: "系统",
    });
    await service.createAuditLog({
      targetType: "manifest-version",
      targetId: "manifest-version-1",
      action: "publish",
      operatorId: "reviewer-1",
      operatorName: "审核员",
    });

    const result = await service.listAuditLogs({ page: 1, pageSize: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 1, total: 2 });
  });

  it("应支持 targetType / targetId / action / operatorId 筛选", async () => {
    const service = createService();
    await service.createAuditLog({
      targetType: "asset-version",
      targetId: "asset-version-1",
      action: "submit-review",
      operatorId: "editor-1",
    });
    await service.createAuditLog({
      targetType: "asset-version",
      targetId: "asset-version-2",
      action: "reject",
      operatorId: "reviewer-1",
    });

    await expect(service.listAuditLogs({ targetType: "asset-version" })).resolves.toMatchObject({
      pagination: { total: 2 },
    });
    await expect(service.listAuditLogs({ targetId: "asset-version-1" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "submit-review" }],
    });
    await expect(service.listAuditLogs({ action: "reject" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ targetId: "asset-version-2" }],
    });
    await expect(service.listAuditLogs({ operatorId: "reviewer-1" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "reject" }],
    });
  });
});
