import { describe, expect, it } from "vitest";
import { createHubRepositoryProvider } from "@/server/hub/repositories/repository-factory";
import type { PrismaHubClientLike } from "@/server/hub/repositories/repository-types";

function mockPrismaClient(): PrismaHubClientLike {
  const delegate = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 0,
    create: async () => ({}),
  };
  return {
    hubAsset: delegate,
    hubAssetVersion: delegate,
    hubManifest: delegate,
    hubManifestVersion: delegate,
    hubManifestAsset: delegate,
    hubAgentProfile: delegate,
    hubInstallRecord: delegate,
    hubRuntimeFeedback: delegate,
    hubAuditLog: delegate,
  };
}

describe("createHubRepositoryProvider", () => {
  it("memory 模式应创建内存仓储", () => {
    const provider = createHubRepositoryProvider({ mode: "memory" });

    expect(provider.mode).toBe("memory");
    expect(provider.repository.listAssets).toBeTypeOf("function");
  });

  it("prisma 模式应使用注入的 Prisma Client 创建仓储", () => {
    const provider = createHubRepositoryProvider({ mode: "prisma", prismaClient: mockPrismaClient() });

    expect(provider.mode).toBe("prisma");
    expect(provider.repository.listManifests).toBeTypeOf("function");
  });

  it("未知 HUB_REPOSITORY_MODE 应返回中文错误", () => {
    expect(() => createHubRepositoryProvider({ mode: "unknown" })).toThrow("HUB_REPOSITORY_MODE 不合法");
  });

  it("prisma 模式缺少 Prisma Client 时应返回中文错误", () => {
    expect(() => createHubRepositoryProvider({ mode: "prisma" })).toThrow("Prisma Repository 需要注入 Prisma Client");
  });
});
