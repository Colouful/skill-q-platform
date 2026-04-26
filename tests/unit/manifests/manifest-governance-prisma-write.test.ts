import { describe, expect, it, vi } from "vitest";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { PrismaTransactionManager } from "@/server/hub/transactions/prisma-transaction-manager";
import type { PrismaDelegateLike, PrismaTransactionalHubClientLike } from "@/server/hub/repositories/repository-types";

const now = new Date("2026-04-26T00:00:00.000Z");

function delegate(items: Array<Record<string, unknown>>): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where ?? {} : {};
      return items.find((item) => Object.entries(where).every(([key, value]) => item[key] === value)) ?? null;
    }),
    findUnique: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where : {};
      return items.find((item) => item.id === where?.id) ?? null;
    }),
    count: vi.fn(async () => items.length),
    create: vi.fn(async (args?: unknown) => {
      const data = args && typeof args === "object" && "data" in args ? (args as { data?: Record<string, unknown> }).data ?? {} : {};
      const item = { id: `manifest-${items.length + 1}`, ...data, createdAt: now, updatedAt: now };
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

function prismaClient(manifests: Array<Record<string, unknown>>): PrismaTransactionalHubClientLike {
  const empty = delegate([]);
  const base = {
    hubAsset: empty,
    hubAssetVersion: empty,
    hubManifest: delegate(manifests),
    hubManifestVersion: empty,
    hubManifestAsset: empty,
    hubAgentProfile: empty,
    hubInstallRecord: empty,
    hubRuntimeFeedback: empty,
    hubAuditLog: empty,
  };
  return { ...base, $transaction: vi.fn(async (handler) => handler(base)) };
}

describe("ManifestGovernanceService Prisma 写事务", () => {
  it("prisma 模式应支持 Manifest 创建、更新和归档", async () => {
    const manifests: Array<Record<string, unknown>> = [];
    const service = new ManifestGovernanceService({
      transactionManager: new PrismaTransactionManager(prismaClient(manifests)),
    });

    const created = await service.createDraft({ slug: "prisma-manifest", name: "Prisma Manifest", scope: "platform" });
    expect(created.manifest).toMatchObject({ slug: "prisma-manifest", status: "draft" });

    const updated = await service.updateDraft(created.manifest.id, { name: "Prisma Manifest 更新" });
    expect(updated.manifest.name).toBe("Prisma Manifest 更新");

    const archived = await service.archive(created.manifest.id, { reason: "归档" });
    expect(archived.manifest.status).toBe("archived");
  });

  it("slug 重复时应返回 MANIFEST_SLUG_ALREADY_EXISTS", async () => {
    const service = new ManifestGovernanceService({
      transactionManager: new PrismaTransactionManager(prismaClient([
        { id: "manifest-1", slug: "same-slug", name: "已有", scope: "platform", status: "draft", createdAt: now, updatedAt: now },
      ])),
    });

    await expect(service.createDraft({ slug: "same-slug", name: "重复", scope: "platform" })).rejects.toMatchObject({
      code: "MANIFEST_SLUG_ALREADY_EXISTS",
    });
  });
});
