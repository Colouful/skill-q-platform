import { describe, expect, it, vi } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { PrismaTransactionManager } from "@/server/hub/transactions/prisma-transaction-manager";
import type { PrismaDelegateLike, PrismaTransactionalHubClientLike } from "@/server/hub/repositories/repository-types";

const now = new Date("2026-04-26T00:00:00.000Z");

function createDelegate(items: Array<Record<string, unknown>>): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where : {};
      if (!where || Object.keys(where).length === 0) return items[0] ?? null;
      return items.find((item) => Object.entries(where).every(([key, value]) => item[key] === value)) ?? null;
    }),
    findUnique: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where : {};
      return items.find((item) => item.id === where?.id) ?? null;
    }),
    count: vi.fn(async () => items.length),
    create: vi.fn(async (args?: unknown) => {
      const data = args && typeof args === "object" && "data" in args ? (args as { data?: Record<string, unknown> }).data ?? {} : {};
      const item = { id: `asset-${items.length + 1}`, ...data, createdAt: now, updatedAt: now };
      items.push(item);
      return item;
    }),
    update: vi.fn(async (args?: unknown) => {
      const value = args as { where?: { id?: string }; data?: Record<string, unknown> };
      const index = items.findIndex((item) => item.id === value.where?.id);
      const next = { ...items[index], ...(value.data ?? {}), updatedAt: now };
      items[index] = next;
      return next;
    }),
  };
}

function createPrismaClient(assets: Array<Record<string, unknown>> = []): PrismaTransactionalHubClientLike {
  const delegate = createDelegate([]);
  const base = {
    hubAsset: createDelegate(assets),
    hubAssetVersion: delegate,
    hubManifest: delegate,
    hubManifestVersion: delegate,
    hubManifestAsset: delegate,
    hubAgentProfile: delegate,
    hubInstallRecord: delegate,
    hubRuntimeFeedback: delegate,
    hubAuditLog: delegate,
  };
  return { ...base, $transaction: vi.fn(async (handler) => handler(base)) };
}

describe("AssetGovernanceService Prisma 写事务", () => {
  it("prisma 模式应支持 Asset 创建、更新和归档", async () => {
    const assets: Array<Record<string, unknown>> = [];
    const service = new AssetGovernanceService({
      transactionManager: new PrismaTransactionManager(createPrismaClient(assets)),
    });

    const created = await service.createDraft({
      slug: "prisma-write-asset",
      name: "Prisma 写资产",
      kind: "rule",
      scope: "platform",
    });
    expect(created.asset).toMatchObject({ slug: "prisma-write-asset", status: "draft" });

    const updated = await service.updateDraft(created.asset.id, { name: "Prisma 写资产更新" });
    expect(updated.asset.name).toBe("Prisma 写资产更新");

    const archived = await service.archive(created.asset.id, { reason: "归档" });
    expect(archived.asset.status).toBe("archived");
  });

  it("prisma 模式 slug 重复时应返回 ASSET_SLUG_ALREADY_EXISTS", async () => {
    const assets: Array<Record<string, unknown>> = [
      {
        id: "asset-1",
        slug: "duplicate-slug",
        name: "已有资产",
        kind: "rule",
        scope: "platform",
        status: "draft",
        description: "",
        createdAt: now,
        updatedAt: now,
      },
    ];
    const service = new AssetGovernanceService({
      transactionManager: new PrismaTransactionManager(createPrismaClient(assets)),
    });

    await expect(
      service.createDraft({ slug: "duplicate-slug", name: "重复", kind: "rule", scope: "platform" }),
    ).rejects.toMatchObject({ code: "ASSET_SLUG_ALREADY_EXISTS" });
  });
});
