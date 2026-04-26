import { describe, expect, it } from "vitest";
import { AuditLogService } from "@/server/hub/audit-log-service";

describe("AuditLogService", () => {
  it("应写入并查询审计占位记录", () => {
    const service = new AuditLogService();
    service.clear();

    const log = service.append({
      targetType: "asset-version",
      targetId: "asset-version-1",
      action: "submit-review",
      statusFrom: "draft",
      statusTo: "reviewing",
      note: "提交审核",
    });

    const result = service.list({ targetType: "asset-version", targetId: "asset-version-1" });

    expect(log).toEqual(expect.objectContaining({ operator: "system", action: "submit-review" }));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(expect.objectContaining({ targetId: "asset-version-1" }));
  });
});
