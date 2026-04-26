import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import {
  createHubRepositoryProvider,
  getHubRepositoryProvider,
} from "@/server/hub/repositories/hub-repository-provider";
import type { PrismaDelegateLike, PrismaHubClientLike } from "@/server/hub/repositories/repository-types";

function delegate(): PrismaDelegateLike {
  return {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 0,
    create: async () => ({}),
  };
}

function mockPrismaClient(): PrismaHubClientLike {
  const d = delegate();
  return {
    hubAsset: d,
    hubAssetVersion: d,
    hubManifest: d,
    hubManifestVersion: d,
    hubManifestAsset: d,
    hubAgentProfile: d,
    hubInstallRecord: d,
    hubRuntimeFeedback: d,
    hubAuditLog: d,
  };
}

describe("hub-repository-provider", () => {
  it("memory 模式不需要 Prisma Client", async () => {
    const repo = createHubRepository();
    repo.createAsset({ slug: "memory-provider-asset", name: "Memory Asset", kind: "role" });
    const repository = createHubRepositoryProvider({ mode: "memory", memoryRepository: repo });

    await expect(repository.listAssets({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "memory-provider-asset" }],
    });
  });

  it("prisma 模式必须注入 Prisma Client", () => {
    expect(() => createHubRepositoryProvider({ mode: "prisma" })).toThrow("Prisma 查询仓储需要注入 Prisma Client");
  });

  it("prisma 模式可通过注入的 mock Prisma Client 创建仓储", async () => {
    const repository = createHubRepositoryProvider({ mode: "prisma", prismaClient: mockPrismaClient() });

    await expect(repository.listAssets({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 0 },
      items: [],
    });
  });

  it("未知 Repository Mode 应返回中文错误", () => {
    expect(() => getHubRepositoryProvider({ mode: "invalid" as never })).toThrow("HUB_REPOSITORY_MODE 不合法");
  });
});
