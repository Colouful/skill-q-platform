import { randomUUID } from "node:crypto";

import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";

export function createManifestFixture() {
  const repo = createHubRepository();
  const manifestService = new ManifestGovernanceService(repo);
  const versionService = new ManifestVersionService(repo);
  const manifest = manifestService.createDraft({
    slug: `manifest-${randomUUID()}`,
    name: "测试 Manifest",
    scope: "platform",
    description: "用于 Manifest 管理测试",
    tags: ["p2"],
    techStacks: ["react"],
    projectKinds: ["frontend"],
    recommendedFor: ["web"],
  });
  return { repo, manifest, manifestService, versionService };
}

export function createPublishedAsset(repo = createHubRepository(), kind: "role" | "flow" = "role") {
  const assetService = new AssetGovernanceService(repo);
  const versionService = new AssetVersionService(repo);
  const asset = assetService.createDraft({
    slug: `${kind}-${randomUUID()}`,
    name: `测试 ${kind}`,
    kind,
    scope: "platform",
  });
  const draftVersion = versionService.create(asset.asset.id, {
    version: "1.0.0",
    content: `# ${kind}\n`,
    contentFormat: "markdown",
  });
  const publishedVersion = versionService.publish(asset.asset.id, draftVersion.version.id, {});
  return { asset: asset.asset, version: publishedVersion.version, repo };
}
