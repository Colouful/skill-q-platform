import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";
import type { PrismaDelegateLike, PrismaTransactionalHubClientLike } from "@/server/hub/repositories/repository-types";
import { PrismaTransactionManager } from "@/server/hub/transactions/prisma-transaction-manager";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";
import { ReviewWorkflowService } from "@/server/hub/review-workflow-service";

const now = new Date("2026-04-27T00:00:00.000Z");

function delegate(items: Array<Record<string, unknown>>): PrismaDelegateLike {
  const matches = (item: Record<string, unknown>, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => item[key] === value);
  return {
    findMany: async () => items,
    findFirst: async (args?: unknown) => {
      const where = (args as { where?: Record<string, unknown> } | undefined)?.where ?? {};
      return items.find((item) => matches(item, where)) ?? null;
    },
    findUnique: async (args?: unknown) => {
      const where = (args as { where?: Record<string, unknown> } | undefined)?.where ?? {};
      return items.find((item) => matches(item, where)) ?? null;
    },
    count: async () => items.length,
    create: async (args?: unknown) => {
      const data = (args as { data?: Record<string, unknown> } | undefined)?.data ?? {};
      const record = { id: data.id ?? `created-${items.length + 1}`, createdAt: now, updatedAt: now, ...data };
      items.push(record);
      return record;
    },
    update: async (args?: unknown) => {
      const { where = {}, data = {} } = (args as { where?: Record<string, unknown>; data?: Record<string, unknown> } | undefined) ?? {};
      const index = items.findIndex((item) => matches(item, where));
      if (index < 0) throw new Error("记录不存在");
      items[index] = { ...items[index], ...data, updatedAt: now };
      return items[index];
    },
  };
}

function createPrismaClient(): PrismaTransactionalHubClientLike {
  const asset = {
    id: "asset-1",
    slug: "prisma-review-asset",
    name: "Prisma 审核资产",
    kind: "rule",
    scope: "platform",
    status: "draft",
    description: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  const assetVersion = {
    id: "asset-version-1",
    assetId: "asset-1",
    version: "1.0.0",
    content: "# Asset\n",
    contentFormat: "markdown",
    checksum: "sha256:asset",
    status: "draft",
    immutable: false,
    qualityScore: 0,
    dependencies: [],
    compatibility: {},
    contentSize: 8,
    createdAt: now,
    publishedAt: null,
  };
  const manifest = {
    id: "manifest-1",
    slug: "prisma-review-manifest",
    name: "Prisma 审核 Manifest",
    scope: "platform",
    status: "draft",
    description: "",
    tags: [],
    techStacks: [],
    projectKinds: [],
    recommendedFor: [],
    createdAt: now,
    updatedAt: now,
  };
  const manifestVersion = {
    id: "manifest-version-1",
    manifestId: "manifest-1",
    version: "1.0.0",
    status: "draft",
    checksum: "sha256:manifest",
    installPolicy: { defaultExecutor: "cursor", fallbackExecutors: ["claude-code", "codex"] },
    compatibility: {},
    assets: [],
    createdAt: now,
    publishedAt: null,
  };
  const profile = {
    id: "profile-1",
    slug: "prisma-review-agent",
    name: "Prisma 审核 Agent",
    version: "1.0.0",
    description: "",
    scope: "platform",
    status: "draft",
    content: {
      slug: "prisma-review-agent",
      name: "Prisma 审核 Agent",
      defaultExecutor: "cursor",
      fallbackExecutors: ["claude-code", "codex"],
      deniedTools: ["upload-source", "deploy", "push", "merge"],
      contextScope: { allowSourceCode: false, allowRelativePath: true, allowAbsolutePath: false },
      modelPolicy: { tokenBudget: 80000, reasoningEffort: "medium" },
      approvalPolicy: { beforePush: true, beforeMerge: true, highRiskAlwaysManual: true },
      outputContract: { mustReturn: ["summary"] },
      riskLevel: "medium",
    },
    riskLevel: "medium",
    checksum: "sha256:profile",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
  const client = {} as PrismaTransactionalHubClientLike;
  Object.assign(client, {
    hubAsset: delegate([asset]),
    hubAssetVersion: delegate([assetVersion]),
    hubManifest: delegate([manifest]),
    hubManifestVersion: delegate([manifestVersion]),
    hubManifestAsset: delegate([]),
    hubAgentProfile: delegate([profile]),
    hubInstallRecord: delegate([]),
    hubRuntimeFeedback: delegate([]),
    hubAuditLog: delegate([]),
    $transaction: async <T,>(handler: (tx: PrismaTransactionalHubClientLike) => Promise<T>): Promise<T> => handler(client),
  });
  return client;
}

describe("ReviewWorkflowService repository mode", () => {
  it("memory 模式提交审核不需要 Prisma Client", async () => {
    const repo = createHubRepository();
    const repository = new InMemoryHubRepositoryAdapter(repo);
    const asset = await repository.createAsset({ slug: "memory-review-asset", name: "内存审核资产", kind: "rule", scope: "platform" });
    const version = await repository.createAssetVersion({
      assetId: asset.id,
      version: "1.0.0",
      content: "# Memory\n",
      contentFormat: "markdown",
      checksum: "sha256:memory",
      contentSize: 9,
    });
    const workflow = new ReviewWorkflowService({ transactionManager: new MemoryTransactionManager(repo) });

    await expect(workflow.submitAssetVersion(asset.id, version.id, {})).resolves.toMatchObject({
      version: { status: "reviewing" },
    });
  });

  it("prisma 模式 Asset / Manifest / Agent Profile 提交审核和驳回走同一个 Prisma 事务上下文", async () => {
    const workflow = new ReviewWorkflowService({ transactionManager: new PrismaTransactionManager(createPrismaClient()) });

    await expect(workflow.submitAssetVersion("asset-1", "asset-version-1", {})).resolves.toMatchObject({ version: { status: "reviewing" } });
    await expect(workflow.rejectAssetVersion("asset-1", "asset-version-1", { reason: "调整资产" })).resolves.toMatchObject({
      version: { status: "rejected" },
    });
    await expect(workflow.submitManifestVersion("manifest-1", "manifest-version-1", {})).resolves.toMatchObject({ version: { status: "reviewing" } });
    await expect(workflow.rejectManifestVersion("manifest-1", "manifest-version-1", { reason: "调整 Manifest" })).resolves.toMatchObject({
      version: { status: "rejected" },
    });
    await expect(workflow.submitAgentProfile("profile-1", {})).resolves.toMatchObject({ profile: { status: "reviewing" } });
    await expect(workflow.rejectAgentProfile("profile-1", { reason: "调整 Agent" })).resolves.toMatchObject({ profile: { status: "rejected" } });
  });
});
