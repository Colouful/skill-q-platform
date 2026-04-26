import { describe, expect, it, vi } from "vitest";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestQueryService } from "@/server/hub/manifest-query-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
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
    slug: "prisma-role",
    name: "Prisma Role",
    kind: "role",
    scope: "platform",
    status: "published",
    description: "asset",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  const assetVersion = {
    id: "asset-version-prisma-1",
    assetId: "asset-prisma-1",
    version: "1.0.0",
    content: "# Role",
    contentFormat: "markdown",
    checksum: "asset-checksum",
    status: "published",
    immutable: true,
    qualityScore: 90,
    dependencies: [],
    compatibility: {},
    createdAt: now,
    publishedAt: now,
  };
  const manifest = {
    id: "manifest-prisma-1",
    slug: "prisma-query-manifest",
    name: "Prisma 查询 Manifest",
    scope: "platform",
    status: "published",
    description: "查询链路 smoke",
    tags: ["frontend", "/Users/secret"],
    techStacks: ["react"],
    projectKinds: ["web"],
    recommendedFor: ["demo"],
    versions: [{ id: "manifest-version-prisma-1", status: "published", assets: [{ id: "binding-prisma-1" }] }],
    createdAt: now,
    updatedAt: now,
  };
  const manifestVersion = {
    id: "manifest-version-prisma-1",
    manifestId: "manifest-prisma-1",
    version: "1.0.0",
    status: "published",
    checksum: "manifest-checksum",
    installPolicy: { defaultExecutor: "cursor", fallbackExecutors: ["claude-code", "codex"] },
    compatibility: {},
    assets: [{ id: "binding-prisma-1" }],
    createdAt: now,
    publishedAt: now,
  };
  const binding = {
    id: "binding-prisma-1",
    manifestVersionId: "manifest-version-prisma-1",
    assetId: "asset-prisma-1",
    assetVersionId: "asset-version-prisma-1",
    kind: "role",
    required: true,
    loadWhen: ["always"],
    order: 1,
    asset,
    assetVersion,
  };
  return {
    hubAsset: delegate([asset]),
    hubAssetVersion: delegate([assetVersion]),
    hubManifest: delegate([manifest]),
    hubManifestVersion: delegate([manifestVersion]),
    hubManifestAsset: delegate([binding]),
    hubAgentProfile: delegate([]),
    hubInstallRecord: delegate([]),
    hubRuntimeFeedback: delegate([]),
    hubAuditLog: delegate([]),
  };
}

describe("ManifestQueryService Repository 模式", () => {
  it("memory 模式应返回 V2.1 兼容结构", async () => {
    const repo = createHubRepository();
    const governance = new ManifestGovernanceService(repo);
    const versions = new ManifestVersionService(repo);
    const manifest = governance.createDraft({
      slug: "memory-query-manifest",
      name: "Memory 查询 Manifest",
      scope: "platform",
      techStacks: ["react"],
    });
    const version = versions.create(manifest.manifest.id, { version: "1.0.0" });
    repo.manifestVersions.find((item) => item.id === version.version.id)!.status = "published";

    const result = await new ManifestQueryService(repo).list(new URLSearchParams("keyword=memory"));

    expect(result).toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "memory-query-manifest", versionCount: 1, publishedVersionCount: 1 }],
    });
  });

  it("prisma 模式应返回 V2.1 兼容结构并不暴露资产正文", async () => {
    const service = new ManifestQueryService(new PrismaHubRepository(mockPrismaClient()));

    const result = await service.list(new URLSearchParams("keyword=prisma"));
    const detail = await service.detail("manifest-prisma-1");

    expect(result).toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "prisma-query-manifest", assetBindingCount: 1 }],
    });
    expect(detail.assetBindings[0]).toMatchObject({ assetSlug: "prisma-role", checksum: "asset-checksum" });
    expect(JSON.stringify(detail)).not.toContain("# Role");
    expect(JSON.stringify(result)).not.toContain("/Users/");
    expect(JSON.stringify(result)).not.toContain("rawPrompt");
  });
});
