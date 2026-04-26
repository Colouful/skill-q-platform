import { describe, expect, it, vi } from "vitest";
import { PrismaAuditLogRepository } from "@/server/hub/repositories/prisma/prisma-audit-log-repository";
import type { PrismaDelegateLike, PrismaHubClientLike } from "@/server/hub/repositories/repository-types";

const now = new Date("2026-04-26T00:00:00.000Z");

function delegate(items: unknown[] = []): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async () => items[0] ?? null),
    findUnique: vi.fn(async () => items[0] ?? null),
    count: vi.fn(async () => items.length),
    create: vi.fn(async (args: unknown) => {
      const data = args && typeof args === "object" && "data" in args ? (args as { data: Record<string, unknown> }).data : {};
      return { ...data, createdAt: data.createdAt ?? now };
    }),
  };
}

function mockClient(items: unknown[] = []): PrismaHubClientLike {
  const empty = delegate();
  return {
    hubAsset: empty,
    hubAssetVersion: empty,
    hubManifest: empty,
    hubManifestVersion: empty,
    hubManifestAsset: empty,
    hubAgentProfile: empty,
    hubInstallRecord: empty,
    hubRuntimeFeedback: empty,
    hubAuditLog: delegate(items),
  };
}

describe("PrismaAuditLogRepository", () => {
  it("应写入审计日志并通过 mapper 返回稳定结构", async () => {
    const repository = new PrismaAuditLogRepository(mockClient());

    const log = await repository.createAuditLog({
      id: "audit-1",
      targetType: "asset-version",
      targetId: "version-1",
      targetSlug: "asset-a",
      targetVersion: "1.0.0",
      action: "submit-review",
      statusFrom: "draft",
      statusTo: "reviewing",
      operatorId: "system",
      operatorName: "系统",
      metadata: { source: "unit-test" },
      requestId: "request-1",
    });

    expect(log).toMatchObject({
      id: "audit-1",
      targetType: "asset-version",
      targetId: "version-1",
      operatorId: "system",
      operatorName: "系统",
      operator: "系统",
      metadata: { source: "unit-test" },
      createdAt: "2026-04-26T00:00:00.000Z",
    });
  });

  it("应按 createdAt 倒序查询审计日志", async () => {
    const repository = new PrismaAuditLogRepository(mockClient([
      {
        id: "audit-1",
        targetType: "agent-profile",
        targetId: "profile-1",
        action: "publish",
        operatorId: "reviewer-1",
        operatorName: "审核员",
        createdAt: now,
      },
    ]));

    const result = await repository.listAuditLogs({ targetType: "agent-profile", page: 1, pageSize: 20 });

    expect(result).toMatchObject({
      pagination: { page: 1, pageSize: 20, total: 1 },
      items: [{ targetId: "profile-1", action: "publish" }],
    });
  });

  it("metadata 包含敏感字段时应拒绝写入", async () => {
    const repository = new PrismaAuditLogRepository(mockClient());

    await expect(repository.createAuditLog({
      targetType: "asset-version",
      targetId: "version-1",
      action: "submit-review",
      metadata: { nested: { token: "secret" } },
    })).rejects.toMatchObject({ code: "AUDIT_LOG_PRIVACY_VIOLATED" });
  });
});
