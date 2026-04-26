import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { ManifestAssetBindingService } from "@/server/hub/manifest-asset-binding-service";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";

async function fixture() {
  const repo = createHubRepository();
  const manager = new MemoryTransactionManager(repo);
  const asset = await new AssetGovernanceService({ transactionManager: manager }).createDraft({
    slug: `manifest-publish-asset-${Date.now()}`,
    name: "发布绑定资产",
    kind: "rule",
    scope: "platform",
  });
  const assetVersion = await new AssetVersionService({ transactionManager: manager }).create(asset.asset.id, {
    version: "1.0.0",
    content: "# Publish Binding\n",
  });
  await new AssetVersionService({ transactionManager: manager }).publish(asset.asset.id, assetVersion.version.id, {});
  const manifest = await new ManifestGovernanceService({ transactionManager: manager }).createDraft({
    slug: `manifest-publish-${Date.now()}`,
    name: "发布 Manifest",
    scope: "platform",
  });
  const manifestVersion = await new ManifestVersionService({ transactionManager: manager }).create(manifest.manifest.id, { version: "1.0.0" });
  await new ManifestAssetBindingService({ transactionManager: manager }).bind(manifest.manifest.id, manifestVersion.version.id, {
    assetId: asset.asset.id,
    assetVersionId: assetVersion.version.id,
    kind: "rule",
    required: true,
  });
  manager.adapter.clearAuditLogs();
  return { repo, manager, manifest, manifestVersion };
}

describe("Manifest 发布与 AuditLog 事务一致性", () => {
  it("发布成功后应写入 AuditLog 并更新 Manifest 状态", async () => {
    const { repo, manager, manifest, manifestVersion } = await fixture();

    await new ManifestVersionService({ transactionManager: manager }).publish(manifest.manifest.id, manifestVersion.version.id, {
      publishNote: "发布审计",
    });

    expect(repo.manifests.find((item) => item.id === manifest.manifest.id)?.status).toBe("published");
    await expect(manager.adapter.listAuditLogs({ targetType: "manifest-version", targetId: manifestVersion.version.id })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "publish", statusFrom: "draft", statusTo: "published" }],
    });
  });

  it("AuditLog 写入失败时应回滚 ManifestVersion 发布", async () => {
    const { repo, manager, manifest, manifestVersion } = await fixture();
    manager.adapter.createAuditLog = async () => {
      throw new Error("审计写入失败");
    };

    await expect(new ManifestVersionService({ transactionManager: manager }).publish(manifest.manifest.id, manifestVersion.version.id, {})).rejects.toThrow(
      "审计写入失败",
    );
    expect(repo.manifestVersions.find((item) => item.id === manifestVersion.version.id)?.status).toBe("draft");
    expect(repo.manifests.find((item) => item.id === manifest.manifest.id)?.status).toBe("draft");
  });
});
