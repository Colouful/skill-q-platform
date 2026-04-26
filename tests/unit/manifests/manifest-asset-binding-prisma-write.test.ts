import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { ManifestAssetBindingService } from "@/server/hub/manifest-asset-binding-service";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";

async function fixture() {
  const manager = new MemoryTransactionManager(createHubRepository());
  const asset = await new AssetGovernanceService({ transactionManager: manager }).createDraft({
    slug: `binding-prisma-${Date.now()}`,
    name: "绑定资产",
    kind: "rule",
    scope: "platform",
  });
  const assetVersion = await new AssetVersionService({ transactionManager: manager }).create(asset.asset.id, {
    version: "1.0.0",
    content: "# Binding\n",
  });
  await new AssetVersionService({ transactionManager: manager }).publish(asset.asset.id, assetVersion.version.id, {});
  const manifest = await new ManifestGovernanceService({ transactionManager: manager }).createDraft({
    slug: `binding-manifest-${Date.now()}`,
    name: "绑定 Manifest",
    scope: "platform",
  });
  const manifestVersion = await new ManifestVersionService({ transactionManager: manager }).create(manifest.manifest.id, { version: "1.0.0" });
  return { manager, asset, assetVersion, manifest, manifestVersion };
}

describe("ManifestAssetBindingService 写事务", () => {
  it("应绑定、排序并解绑 published AssetVersion", async () => {
    const { manager, asset, assetVersion, manifest, manifestVersion } = await fixture();
    const service = new ManifestAssetBindingService({ transactionManager: manager });

    const bound = await service.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: asset.asset.id,
      assetVersionId: assetVersion.version.id,
      kind: "rule",
      required: true,
    });
    expect(bound.binding?.bindingId).toEqual(expect.any(String));

    const reordered = await service.reorder(manifest.manifest.id, manifestVersion.version.id, {
      items: [{ bindingId: bound.binding?.bindingId, order: 2 }],
    });
    expect(reordered.items[0]?.order).toBe(2);

    const removed = await service.unbind(manifest.manifest.id, manifestVersion.version.id, String(bound.binding?.bindingId));
    expect(removed.removed).toBe(true);
  });

  it("kind 与 Asset.kind 不一致时应报错", async () => {
    const { manager, asset, assetVersion, manifest, manifestVersion } = await fixture();

    await expect(new ManifestAssetBindingService({ transactionManager: manager }).bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: asset.asset.id,
      assetVersionId: assetVersion.version.id,
      kind: "skill",
    })).rejects.toMatchObject({ code: "MANIFEST_ASSET_BINDING_NOT_ALLOWED" });
  });
});
