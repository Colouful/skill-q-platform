import { describe, expect, it } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { ManifestAssetBindingService } from "@/server/hub/manifest-asset-binding-service";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";
import type { HubTransactionContext } from "@/server/hub/transactions/transaction-context";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";
import type { TransactionManagerPort } from "@/server/hub/transactions/transaction-manager-port";
import { ReviewWorkflowService } from "@/server/hub/review-workflow-service";
import { createAgentProfileContent } from "../agent-profiles/agent-profile-test-fixtures";
import { createPublishedAsset } from "../manifests/manifest-test-fixtures";

function createAssetFixture() {
  const repo = createHubRepository();
  const asset = new AssetGovernanceService(repo).createDraft({
    slug: "tx-review-asset",
    name: "事务审核资产",
    kind: "rule",
    scope: "platform",
  }).asset;
  const version = new AssetVersionService(repo).create(asset.id, { version: "1.0.0", content: "# Asset\n" }).version;
  const manager = new MemoryTransactionManager(repo);
  return { repo, manager, workflow: new ReviewWorkflowService({ transactionManager: manager }), asset, version };
}

function createManifestFixture() {
  const repo = createHubRepository();
  const manifest = new ManifestGovernanceService(repo).createDraft({
    slug: "tx-review-manifest",
    name: "事务审核 Manifest",
    scope: "platform",
  }).manifest;
  const version = new ManifestVersionService(repo).create(manifest.id, { version: "1.0.0" }).version;
  const asset = createPublishedAsset(repo);
  new ManifestAssetBindingService(repo).bind(manifest.id, version.id, {
    assetId: asset.asset.id,
    assetVersionId: asset.version.id,
    kind: "role",
    required: true,
  });
  const manager = new MemoryTransactionManager(repo);
  return { manager, workflow: new ReviewWorkflowService({ transactionManager: manager }), manifest, version };
}

function createAgentFixture() {
  const repo = createHubRepository();
  const profile = new AgentProfileGovernanceService(repo).createDraft({
    slug: "tx-review-agent",
    name: "事务审核 Agent",
    version: "1.0.0",
    content: createAgentProfileContent({ slug: "tx-review-agent", name: "事务审核 Agent" }),
  }).profile;
  const manager = new MemoryTransactionManager(repo);
  return { repo, manager, workflow: new ReviewWorkflowService({ transactionManager: manager }), profile };
}

class FailingAuditTransactionManager implements TransactionManagerPort {
  constructor(private readonly delegate: MemoryTransactionManager) {}

  runInTransaction<T>(handler: (tx: HubTransactionContext) => Promise<T>): Promise<T> {
    return this.delegate.runInTransaction((tx) =>
      handler({
        ...tx,
        auditLogs: {
          ...tx.auditLogs,
          createAuditLog: async () => {
            throw new Error("审计写入失败");
          },
        },
      }),
    );
  }
}

describe("ReviewWorkflowService transaction", () => {
  it("Asset Version submit-review 与 AuditLog 写入处于同一事务", async () => {
    const { manager, workflow, asset, version } = createAssetFixture();

    await workflow.submitAssetVersion(asset.id, version.id, { note: "提交审核" });

    await expect(manager.adapter.findAssetVersionByAssetAndId(asset.id, version.id)).resolves.toMatchObject({ status: "reviewing" });
    await expect(manager.adapter.listAuditLogs({ targetId: version.id, action: "submit-review" })).resolves.toMatchObject({
      pagination: { total: 1 },
    });
  });

  it("AuditLog 写入失败时 Asset Version 状态回滚", async () => {
    const { manager, asset, version } = createAssetFixture();
    const workflow = new ReviewWorkflowService({ transactionManager: new FailingAuditTransactionManager(manager) });

    await expect(workflow.submitAssetVersion(asset.id, version.id, { note: "提交审核" })).rejects.toThrow("审计写入失败");

    await expect(manager.adapter.findAssetVersionByAssetAndId(asset.id, version.id)).resolves.toMatchObject({ status: "draft" });
    await expect(manager.adapter.listAuditLogs({ targetId: version.id })).resolves.toMatchObject({ pagination: { total: 0 } });
  });

  it("publish 复用领域发布服务且不重复写 AuditLog", async () => {
    const { manager, workflow, asset, version } = createAssetFixture();
    await workflow.submitAssetVersion(asset.id, version.id, {});

    const published = await workflow.publishAssetVersion(asset.id, version.id, {});

    expect(published.version.status).toBe("published");
    await expect(manager.adapter.listAuditLogs({ targetId: version.id, action: "publish" })).resolves.toMatchObject({
      pagination: { total: 1 },
    });
  });

  it("Manifest Version 和 Agent Profile publish 均复用领域服务并写入单条 publish 审计", async () => {
    const manifestFixture = createManifestFixture();
    await manifestFixture.workflow.submitManifestVersion(manifestFixture.manifest.id, manifestFixture.version.id, {});
    await manifestFixture.workflow.publishManifestVersion(manifestFixture.manifest.id, manifestFixture.version.id, {});
    await expect(manifestFixture.manager.adapter.listAuditLogs({ targetId: manifestFixture.version.id, action: "publish" })).resolves.toMatchObject({
      pagination: { total: 1 },
    });

    const agentFixture = createAgentFixture();
    await agentFixture.workflow.submitAgentProfile(agentFixture.profile.id, {});
    await agentFixture.workflow.publishAgentProfile(agentFixture.profile.id, {});
    await expect(agentFixture.manager.adapter.listAuditLogs({ targetId: agentFixture.profile.id, action: "publish" })).resolves.toMatchObject({
      pagination: { total: 1 },
    });
  });
});
