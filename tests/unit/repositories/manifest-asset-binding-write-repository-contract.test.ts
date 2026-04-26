import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

describe("ManifestAssetBinding write repository contract", () => {
  it("应支持绑定、查询、排序和解绑", async () => {
    const repository = new InMemoryHubRepositoryAdapter(createHubRepository());
    const asset = await repository.createAsset({ slug: "binding-asset", name: "绑定资产", kind: "rule", scope: "platform" });
    const version = await repository.createAssetVersion({
      assetId: asset.id,
      version: "1.0.0",
      content: "# Binding\n",
      contentFormat: "markdown",
      checksum: "sha256:asset",
      status: "published",
      immutable: true,
    });
    await repository.markAssetPublished({ assetId: asset.id, latestVersionId: version.id });
    const manifest = await repository.createManifest({ slug: "binding-manifest", name: "绑定 Manifest", scope: "platform" });
    const manifestVersion = await repository.createManifestVersion({ manifestId: manifest.id, version: "1.0.0" });

    const binding = await repository.createBinding({
      manifestVersionId: manifestVersion.id,
      assetId: asset.id,
      assetVersionId: version.id,
      kind: "rule",
      required: true,
      order: 1,
    });
    expect(binding).toMatchObject({ assetSlug: "binding-asset", checksum: expect.stringMatching(/^sha256:/) });
    await expect(repository.findBindingByAssetVersion(manifestVersion.id, version.id)).resolves.toMatchObject({
      id: binding.id,
    });

    const reordered = await repository.reorderBindings(manifestVersion.id, [{ bindingId: binding.id, order: 2 }]);
    expect(reordered[0]?.order).toBe(2);

    await repository.deleteBinding(manifestVersion.id, binding.id);
    await expect(repository.listBindingsForChecksum(manifestVersion.id)).resolves.toHaveLength(0);
  });
});
