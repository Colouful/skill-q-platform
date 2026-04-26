import { afterEach, describe, expect, it, vi } from "vitest";
import { listAssets, listAuditLogs, requestHubAdmin, submitAssetVersionReview } from "@/lib/hub-admin-client";

describe("hub-admin-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应正确解析 success response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [{ id: "a1", slug: "asset-a", name: "Asset A", kind: "role", scope: "platform", status: "draft" }], pagination: { page: 1, pageSize: 20, total: 1 } },
          error: null,
          requestId: "req",
          timestamp: "2026-04-26T00:00:00.000Z",
        }),
        { status: 200 },
      ),
    );

    const data = await listAssets({ keyword: "asset" });

    expect(data.items[0].slug).toBe("asset-a");
    expect(fetch).toHaveBeenCalledWith("/api/hub/admin/assets?keyword=asset", expect.any(Object));
  });

  it("应正确解析 error response 并抛出中文错误", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { code: "INVALID_PAGINATION", message: "分页参数不合法", suggestion: "请检查分页参数。" },
          requestId: "req",
          timestamp: "2026-04-26T00:00:00.000Z",
        }),
        { status: 400 },
      ),
    );

    await expect(requestHubAdmin("/api/hub/admin/assets")).rejects.toThrow("分页参数不合法");
  });

  it("应封装审核流与审计日志 API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { version: { id: "v1", status: "reviewing" } },
          error: null,
          requestId: "req",
          timestamp: "2026-04-26T00:00:00.000Z",
        }),
        { status: 200 },
      ),
    );

    await submitAssetVersionReview("asset-1", "version-1", { note: "提交审核" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/hub/admin/assets/asset-1/versions/version-1/submit-review",
      expect.objectContaining({ method: "POST" }),
    );

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { items: [], pagination: { page: 1, pageSize: 20, total: 0 } },
          error: null,
          requestId: "req",
          timestamp: "2026-04-26T00:00:00.000Z",
        }),
        { status: 200 },
      ),
    );

    await listAuditLogs({ targetType: "asset-version" });

    expect(fetch).toHaveBeenLastCalledWith("/api/hub/admin/audit-logs?targetType=asset-version", expect.any(Object));
  });
});
