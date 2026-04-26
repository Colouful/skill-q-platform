import { describe, expect, it } from "vitest";
import { AuditLogService } from "@/server/hub/audit-log-service";

describe("AuditLogService", () => {
  it("应写入并查询审计占位记录", async () => {
    const service = new AuditLogService();
    service.clear();

    const log = await service.append({
      targetType: "asset-version",
      targetId: "asset-version-1",
      action: "submit-review",
      statusFrom: "draft",
      statusTo: "reviewing",
      note: "提交审核",
    });

    const result = await service.list({ targetType: "asset-version", targetId: "asset-version-1" });

    expect(log).toEqual(expect.objectContaining({ operatorId: "system", operatorName: "系统", action: "submit-review" }));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(expect.objectContaining({ targetId: "asset-version-1" }));
  });
});
