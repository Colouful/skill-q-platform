import { describe, expect, it } from "vitest";
import { GET as auditGET } from "@/app/api/hub/admin/audit-logs/route";
import { AuditLogService } from "@/server/hub/audit-log-service";

type ApiBody = {
  success: boolean;
  data: null | {
    items: Array<Record<string, unknown>>;
    pagination: { page: number; pageSize: number; total: number };
  };
  error: null | { code: string; message: string; suggestion: string };
};

async function readJson(response: Response) {
  return (await response.json()) as ApiBody;
}

describe("AuditLog API", () => {
  it("GET /api/hub/admin/audit-logs 应返回统一 ApiResponse 且不返回敏感字段", async () => {
    const service = new AuditLogService();
    service.clear();
    await service.createAuditLog({
      targetType: "asset-version",
      targetId: "api-version-1",
      targetSlug: "api-asset",
      targetVersion: "1.0.0",
      action: "submit-review",
      operatorId: "system",
      operatorName: "系统",
      metadata: { safe: "ok" },
    });

    const body = await readJson(await auditGET(new Request("http://localhost/api/hub/admin/audit-logs?targetType=asset-version&page=1&pageSize=20")));

    expect(body.success).toBe(true);
    expect(body.error).toBeNull();
    expect(body.data?.pagination.total).toBe(1);
    expect(body.data?.items[0]).toEqual(expect.objectContaining({
      targetType: "asset-version",
      targetId: "api-version-1",
      operatorId: "system",
      operatorName: "系统",
    }));
    expect(JSON.stringify(body)).not.toContain("sourceCode");
    expect(JSON.stringify(body)).not.toContain("rawPrompt");
    expect(JSON.stringify(body)).not.toContain("rawResponse");
    expect(JSON.stringify(body)).not.toContain("/Users/");
  });

  it("分页参数不合法时应返回中文错误", async () => {
    const body = await readJson(await auditGET(new Request("http://localhost/api/hub/admin/audit-logs?page=0&pageSize=101")));

    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("INVALID_AUDIT_LOG_QUERY");
    expect(body.error?.message).toContain("审计日志查询参数不合法");
  });
});
