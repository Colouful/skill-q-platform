import { describe, expect, it, vi } from "vitest";
import { PrismaTransactionManager } from "@/server/hub/transactions/prisma-transaction-manager";
import type { PrismaDelegateLike, PrismaTransactionalHubClientLike } from "@/server/hub/repositories/repository-types";

function delegate(): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => []),
    findFirst: vi.fn(async () => null),
    findUnique: vi.fn(async () => null),
    count: vi.fn(async () => 0),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
  };
}

function client(): PrismaTransactionalHubClientLike {
  const base = {
    hubAsset: delegate(),
    hubAssetVersion: delegate(),
    hubManifest: delegate(),
    hubManifestVersion: delegate(),
    hubManifestAsset: delegate(),
    hubAgentProfile: delegate(),
    hubInstallRecord: delegate(),
    hubRuntimeFeedback: delegate(),
    hubAuditLog: delegate(),
  };
  return {
    ...base,
    $transaction: vi.fn(async (handler) => handler(base)),
  };
}

describe("PrismaTransactionManager", () => {
  it("应通过 prisma.$transaction 执行 handler", async () => {
    const prisma = client();
    const manager = new PrismaTransactionManager(prisma);

    await manager.runInTransaction(async (tx) => {
      await tx.auditLogs.listAuditLogs({ page: 1, pageSize: 10 });
      return null;
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
