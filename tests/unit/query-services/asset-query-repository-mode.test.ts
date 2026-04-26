import { describe, expect, it, vi } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetQueryService } from "@/server/hub/asset-query-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { PrismaHubRepository } from "@/server/hub/repositories/prisma/prisma-hub-repository";
import type { PrismaDelegateLike, PrismaHubClientLike } from "@/server/hub/repositories/repository-types";

const now = new Date("2026-04-26T00:00:00.000Z");

function delegate(items: unknown[]): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async () => items[0] ?? null),
    findUnique: vi.fn(async () => items[0] ?? null),
    count: vi.fn(async () => items.length),
    create: vi.fn(async () => ({})),
  };
}

function mockPrismaClient(): PrismaHubClientLike {
  const asset = {
    id: "asset-prisma-1",
    slug: "prisma-query-asset",
    name: "Prisma 查询资产",
    kind: "role",
    scope: "platform",
    status: "published",
    description: "查询链路 smoke",
    tags: ["role", "/Users/secret"],
    versions: [{ id: "asset-version-prisma-1", status: "published" }],
    createdAt: now,
    updatedAt: now,
  };
  const assetVersion = {
    id: "asset-version-prisma-1",
    assetId: "asset-prisma-1",
    version: "1.0.0",
    content: "sourceCode should stay in detail only",
    contentFormat: "markdown",
    checksum: "checksum-prisma-asset",
    status: "published",
    immutable: true,
    qualityScore: 90,
    dependencies: [],
    compatibility: {},
    contentSize: 20,
    createdAt: now,
    publishedAt: now,
  };
  return {
    hubAsset: delegate([asset]),
    hubAssetVersion: delegate([assetVersion]),
    hubManifest: delegate([]),
    hubManifestVersion: delegate([]),
    hubManifestAsset: delegate([]),
    hubAgentProfile: delegate([]),
    hubInstallRecord: delegate([]),
    hubRuntimeFeedback: delegate([]),
    hubAuditLog: delegate([]),
  };
}

describe("AssetQueryService Repository 模式", () => {
  it("memory 模式应返回 V2.1 兼容结构", async () => {
    const repo = createHubRepository();
    const governance = new AssetGovernanceService(repo);
    const versions = new AssetVersionService(repo);
    const asset = governance.createDraft({
      slug: "memory-query-asset",
      name: "Memory 查询资产",
      kind: "role",
      scope: "platform",
    });
    versions.publish(asset.asset.id, versions.create(asset.asset.id, { version: "1.0.0", content: "# Role" }).version.id, {});

    const result = await new AssetQueryService(repo).list(new URLSearchParams("keyword=memory"));

    expect(result).toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "memory-query-asset", versionCount: 1, publishedVersionCount: 1 }],
    });
    expect(JSON.stringify(result)).not.toContain("sourceCode");
  });

  it("prisma 模式应返回 V2.1 兼容结构并过滤绝对路径", async () => {
    const repository = new PrismaHubRepository(mockPrismaClient());
    const service = new AssetQueryService(repository);

    const result = await service.list(new URLSearchParams("keyword=prisma"));
    const detail = await service.detail("asset-prisma-1");

    expect(result).toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "prisma-query-asset", versionCount: 1, publishedVersionCount: 1 }],
    });
    expect(detail.versions[0]).not.toHaveProperty("content");
    expect(JSON.stringify(result)).not.toContain("/Users/");
    expect(JSON.stringify(result)).not.toContain("rawPrompt");
    expect(JSON.stringify(result)).not.toContain("rawResponse");
  });
});
