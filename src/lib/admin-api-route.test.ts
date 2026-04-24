import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({
  getAdminFromRequest: vi.fn(),
}));

import { requireAdminJson } from "@/lib/admin-api-route";
import { getAdminFromRequest } from "@/lib/admin-auth";

describe("admin-api-route", () => {
  const prevEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...prevEnv };
    vi.mocked(getAdminFromRequest).mockReset();
  });

  afterEach(() => {
    process.env = prevEnv;
  });

  it("HUB_ADMIN_SECRET 命中时直接放行", async () => {
    process.env.HUB_ADMIN_SECRET = "secret-token";
    vi.mocked(getAdminFromRequest).mockResolvedValue(null);

    const result = await requireAdminJson(
      new Request("http://localhost/api/admin/roles", {
        headers: {
          "X-Hub-Admin-Secret": "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected ok result");
    }
    expect(result.admin).toMatchObject({
      id: "hub-admin-secret",
      email: "hub-admin-secret@local",
      role: "admin",
      isActive: true,
    });
    expect(getAdminFromRequest).not.toHaveBeenCalled();
  });

  it("未命中 secret 时保持原有 admin cookie 逻辑", async () => {
    vi.mocked(getAdminFromRequest).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      passwordHash: "hash",
      role: "admin",
      permissions: [],
      isActive: true,
      createdAt: new Date("2026-04-24T00:00:00.000Z"),
      lastLoginAt: null,
    });

    const result = await requireAdminJson(
      new Request("http://localhost/api/admin/scenarios"),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected ok result");
    }
    expect(result.admin.email).toBe("admin@example.com");
    expect(getAdminFromRequest).toHaveBeenCalledTimes(1);
  });
});
