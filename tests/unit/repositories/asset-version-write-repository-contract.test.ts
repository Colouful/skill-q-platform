import { describe, expect, it } from "vitest";
import { sha256Text } from "@/server/hub/checksum";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

describe("AssetVersion write repository contract", () => {
  it("应支持 AssetVersion 创建、查询、发布和废弃", async () => {
    const repository = new InMemoryHubRepositoryAdapter(createHubRepository());
    const asset = await repository.createAsset({
      slug: "asset-version-write-contract",
      name: "资产版本写契约",
      kind: "rule",
      scope: "platform",
    });

    const content = "# Contract\n";
    const version = await repository.createAssetVersion({
      assetId: asset.id,
      version: "1.0.0",
      content,
      contentFormat: "markdown",
      checksum: sha256Text(content),
      contentSize: content.length,
      status: "draft",
      immutable: false,
    });
    expect(version).toMatchObject({ assetId: asset.id, version: "1.0.0", status: "draft", immutable: false });

    await expect(repository.findAssetVersionByAssetAndVersion(asset.id, "1.0.0")).resolves.toMatchObject({
      id: version.id,
    });

    const published = await repository.publishAssetVersion({
      assetId: asset.id,
      versionId: version.id,
      checksum: sha256Text(content),
      contentSize: content.length,
      publishedBy: "system",
    });
    expect(published).toMatchObject({ status: "published", immutable: true, checksum: sha256Text(content) });

    const deprecated = await repository.deprecateAssetVersion({ assetId: asset.id, versionId: version.id });
    expect(deprecated).toMatchObject({ status: "deprecated", checksum: sha256Text(content) });
  });
});
