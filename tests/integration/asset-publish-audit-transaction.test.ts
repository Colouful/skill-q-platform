import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";

describe("Asset 发布与 AuditLog 事务一致性", () => {
  it("发布成功后应写入 AuditLog", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);
    const asset = await new AssetGovernanceService({ transactionManager: manager }).createDraft({
      slug: "asset-publish-audit",
      name: "发布审计资产",
      kind: "rule",
      scope: "platform",
    });
    const version = await new AssetVersionService({ transactionManager: manager }).create(asset.asset.id, {
      version: "1.0.0",
      content: "# Audit\n",
    });

    await new AssetVersionService({ transactionManager: manager }).publish(asset.asset.id, version.version.id, {
      publishNote: "审计一致性",
    });

    await expect(manager.adapter.listAuditLogs({ targetType: "asset-version", targetId: version.version.id })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "publish", statusFrom: "draft", statusTo: "published" }],
    });
  });

  it("AuditLog 写入失败时应回滚发布状态", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);
    const asset = await new AssetGovernanceService({ transactionManager: manager }).createDraft({
      slug: "asset-publish-rollback",
      name: "发布回滚资产",
      kind: "rule",
      scope: "platform",
    });
    const version = await new AssetVersionService({ transactionManager: manager }).create(asset.asset.id, {
      version: "1.0.0",
      content: "# Rollback\n",
    });
    manager.adapter.createAuditLog = async () => {
      throw new Error("审计写入失败");
    };

    await expect(
      new AssetVersionService({ transactionManager: manager }).publish(asset.asset.id, version.version.id, {}),
    ).rejects.toThrow("审计写入失败");

    expect(repo.assetVersions.find((item) => item.id === version.version.id)?.status).toBe("draft");
    expect(repo.assets.find((item) => item.id === asset.asset.id)?.status).toBe("draft");
  });
});
