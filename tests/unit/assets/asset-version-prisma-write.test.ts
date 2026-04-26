import { describe, expect, it, vi } from "vitest";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { PrismaTransactionManager } from "@/server/hub/transactions/prisma-transaction-manager";
import type { PrismaDelegateLike, PrismaTransactionalHubClientLike } from "@/server/hub/repositories/repository-types";

const now = new Date("2026-04-26T00:00:00.000Z");

function matchesWhere(item: Record<string, unknown>, where: Record<string, unknown> = {}) {
  return Object.entries(where).every(([key, value]) => item[key] === value);
}

function delegate(items: Array<Record<string, unknown>>): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where : {};
      return items.find((item) => matchesWhere(item, where)) ?? null;
    }),
    findUnique: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where : {};
      return items.find((item) => item.id === where?.id) ?? null;
    }),
    count: vi.fn(async () => items.length),
    create: vi.fn(async (args?: unknown) => {
      const data = args && typeof args === "object" && "data" in args ? (args as { data?: Record<string, unknown> }).data ?? {} : {};
      const item = { id: `version-${items.length + 1}`, ...data, createdAt: now, publishedAt: null };
      items.push(item);
      return item;
    }),
    update: vi.fn(async (args?: unknown) => {
      const value = args as { where?: { id?: string }; data?: Record<string, unknown> };
      const index = items.findIndex((item) => item.id === value.where?.id);
      const next = { ...items[index], ...(value.data ?? {}) };
      items[index] = next;
      return next;
    }),
  };
}

function prismaClient(assets: Array<Record<string, unknown>>, versions: Array<Record<string, unknown>>, auditLogs: Array<Record<string, unknown>>): PrismaTransactionalHubClientLike {
  const empty = delegate([]);
  const base = {
    hubAsset: delegate(assets),
    hubAssetVersion: delegate(versions),
    hubManifest: empty,
    hubManifestVersion: empty,
    hubManifestAsset: empty,
    hubAgentProfile: empty,
    hubInstallRecord: empty,
    hubRuntimeFeedback: empty,
    hubAuditLog: delegate(auditLogs),
  };
  return { ...base, $transaction: vi.fn(async (handler) => handler(base)) };
}

describe("AssetVersionService Prisma 写事务", () => {
  it("prisma 模式应支持版本创建和发布审计", async () => {
    const assets: Array<Record<string, unknown>> = [
      {
        id: "asset-1",
        slug: "prisma-version-asset",
        name: "版本资产",
        kind: "rule",
        scope: "platform",
        status: "draft",
        description: "",
        createdAt: now,
        updatedAt: now,
      },
    ];
    const versions: Array<Record<string, unknown>> = [];
    const auditLogs: Array<Record<string, unknown>> = [];
    const service = new AssetVersionService({
      transactionManager: new PrismaTransactionManager(prismaClient(assets, versions, auditLogs)),
    });

    const created = await service.create("asset-1", { version: "1.0.0", content: "# Prisma Version\n" });
    expect(created.version).toMatchObject({
      version: "1.0.0",
      status: "draft",
      immutable: false,
      checksum: expect.stringMatching(/^sha256:/),
    });

    const published = await service.publish("asset-1", created.version.id, { publishNote: "发布" });
    expect(published.version).toMatchObject({ status: "published", immutable: true });
    expect(assets[0]).toMatchObject({ status: "published", latestVersionId: created.version.id });
    expect(auditLogs[0]).toMatchObject({
      targetType: "asset-version",
      targetId: created.version.id,
      action: "publish",
      statusFrom: "draft",
      statusTo: "published",
    });
  });

  it("deprecated version 不应改变 checksum", async () => {
    const assets: Array<Record<string, unknown>> = [
      {
        id: "asset-1",
        slug: "deprecated-version-asset",
        name: "废弃资产",
        kind: "rule",
        scope: "platform",
        status: "published",
        description: "",
        latestVersionId: "version-1",
        createdAt: now,
        updatedAt: now,
      },
    ];
    const versions: Array<Record<string, unknown>> = [
      {
        id: "version-1",
        assetId: "asset-1",
        version: "1.0.0",
        content: "# Deprecated\n",
        contentFormat: "markdown",
        checksum: "sha256:stable",
        status: "published",
        immutable: true,
        qualityScore: 0,
        dependencies: [],
        compatibility: {},
        contentSize: 13,
        createdAt: now,
        publishedAt: now,
      },
    ];
    const service = new AssetVersionService({
      transactionManager: new PrismaTransactionManager(prismaClient(assets, versions, [])),
    });

    const deprecated = await service.deprecate("asset-1", "version-1", { reason: "已有新版本" });

    expect(deprecated.version.status).toBe("deprecated");
    expect(deprecated.version.checksum).toBe("sha256:stable");
  });
});
