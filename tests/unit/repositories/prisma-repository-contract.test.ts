import { describe, expect, it, vi } from "vitest";
import { PrismaHubRepository } from "@/server/hub/repositories/prisma/prisma-hub-repository";
import type { PrismaDelegateLike, PrismaHubClientLike } from "@/server/hub/repositories/repository-types";

const now = new Date("2026-04-26T00:00:00.000Z");

function delegate(items: unknown[]): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async () => items[0] ?? null),
    findUnique: vi.fn(async () => items[0] ?? null),
    count: vi.fn(async () => items.length),
    create: vi.fn(async (args: unknown) => {
      const record = args && typeof args === "object" && "data" in args ? (args as { data: unknown }).data : {};
      return { ...(record as Record<string, unknown>), createdAt: now };
    }),
  };
}

function createMockClient(): PrismaHubClientLike {
  const asset = {
    id: "asset-1",
    slug: "prisma-planner-role",
    name: "Prisma 规划角色",
    kind: "role",
    scope: "platform",
    status: "published",
    description: "Prisma Repository contract",
    tags: ["repository"],
    versions: [{ id: "asset-version-1", status: "published" }],
    createdAt: now,
    updatedAt: now,
  };
  const assetVersion = {
    id: "asset-version-1",
    assetId: "asset-1",
    version: "1.0.0",
    content: "# Role",
    contentFormat: "markdown",
    checksum: "asset-checksum",
    status: "published",
    immutable: true,
    qualityScore: 90,
    dependencies: [],
    compatibility: {},
    contentSize: 6,
    createdAt: now,
    publishedAt: now,
  };
  const manifest = {
    id: "manifest-1",
    slug: "prisma-frontend-standard",
    name: "Prisma 前端标准",
    scope: "platform",
    status: "published",
    description: "Prisma Manifest",
    versions: [{ id: "manifest-version-1", status: "published", assets: [{ id: "binding-1" }] }],
    createdAt: now,
    updatedAt: now,
  };
  const manifestVersion = {
    id: "manifest-version-1",
    manifestId: "manifest-1",
    version: "1.0.0",
    status: "published",
    checksum: "manifest-checksum",
    installPolicy: { defaultExecutor: "cursor", fallbackExecutors: ["claude-code", "codex"] },
    compatibility: {},
    assets: [{ id: "binding-1" }],
    createdAt: now,
    publishedAt: now,
  };
  const binding = {
    id: "binding-1",
    manifestVersionId: "manifest-version-1",
    assetId: "asset-1",
    assetVersionId: "asset-version-1",
    kind: "role",
    required: true,
    loadWhen: ["always"],
    order: 1,
    asset,
    assetVersion,
  };
  const profile = {
    id: "profile-1",
    slug: "prisma-diagnostic-agent",
    name: "Prisma 诊断智能体",
    version: "1.0.0",
    scope: "platform",
    status: "published",
    content: {
      defaultExecutor: "cursor",
      deniedTools: ["upload-source", "deploy", "push", "merge"],
      riskLevel: "medium",
    },
    riskLevel: "medium",
    checksum: "profile-checksum",
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  };
  const installRecord = {
    id: "install-1",
    projectId: "project-1",
    workspaceId: "workspace-1",
    manifest: { slug: "prisma-frontend-standard", version: "1.0.0" },
    packages: [{ slug: "prisma-planner-role" }],
    client: { name: "br-ai-spec", version: "1.1.0" },
    status: "accepted",
    installedAt: now,
    createdAt: now,
  };
  const runtimeFeedback = {
    id: "feedback-1",
    projectId: "project-1",
    runId: "run-1",
    manifest: { slug: "prisma-frontend-standard", version: "1.0.0" },
    result: { success: true, durationMs: 1200 },
    executor: "cursor",
    privacyChecked: true,
    createdAt: now,
  };
  return {
    hubAsset: delegate([asset]),
    hubAssetVersion: delegate([assetVersion]),
    hubManifest: delegate([manifest]),
    hubManifestVersion: delegate([manifestVersion]),
    hubManifestAsset: delegate([binding]),
    hubAgentProfile: delegate([profile]),
    hubInstallRecord: delegate([installRecord]),
    hubRuntimeFeedback: delegate([runtimeFeedback]),
    hubAuditLog: delegate([]),
  };
}

describe("PrismaHubRepository contract", () => {
  it("应支持基础 Asset / Manifest / Agent Profile 查询契约", async () => {
    const repository = new PrismaHubRepository(createMockClient());

    await expect(repository.listAssets({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "prisma-planner-role", versionCount: 1, publishedVersionCount: 1 }],
    });
    await expect(repository.findAssetVersionById("asset-version-1")).resolves.toMatchObject({
      checksum: "asset-checksum",
      immutable: true,
    });
    await expect(repository.listManifests({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "prisma-frontend-standard", assetBindingCount: 1 }],
    });
    await expect(repository.listManifestAssetBindings("manifest-version-1")).resolves.toMatchObject([
      { assetSlug: "prisma-planner-role", checksum: "asset-checksum" },
    ]);
    await expect(repository.listAgentProfiles({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "prisma-diagnostic-agent", defaultExecutor: "cursor" }],
    });
  });

  it("应支持 Install Record / Runtime Feedback 查询契约", async () => {
    const repository = new PrismaHubRepository(createMockClient());

    await expect(repository.listInstallRecords({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ manifestSlug: "prisma-frontend-standard", clientName: "br-ai-spec" }],
    });
    await expect(repository.listRuntimeFeedback({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ success: true, executorType: "cursor", privacyChecked: true }],
    });
  });

  it("AuditLog Prisma 应支持基础写入和查询", async () => {
    const repository = new PrismaHubRepository(createMockClient());

    await expect(repository.listAuditLogs({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: { total: 0 },
      items: [],
    });
    await expect(repository.createAuditLog({
      targetType: "asset-version",
      targetId: "version-1",
      action: "submit-review",
      operatorId: "system",
    })).resolves.toMatchObject({ targetId: "version-1", operatorId: "system" });
  });
});
