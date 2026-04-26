import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

describe("Asset write repository contract", () => {
  it("应支持 Asset 创建、更新、发布标记和归档", async () => {
    const repository = new InMemoryHubRepositoryAdapter(createHubRepository());

    const asset = await repository.createAsset({
      slug: "asset-write-contract",
      name: "资产写契约",
      kind: "rule",
      scope: "platform",
      tags: ["contract"],
      visibility: "public",
    });
    expect(asset).toMatchObject({ slug: "asset-write-contract", status: "draft" });

    const updated = await repository.updateAssetDraft({
      assetId: asset.id,
      name: "资产写契约更新",
      tags: ["contract", "updated"],
      updatedBy: "tester",
    });
    expect(updated).toMatchObject({ name: "资产写契约更新", status: "draft", updatedBy: "tester" });

    const published = await repository.markAssetPublished({
      assetId: asset.id,
      latestVersionId: "version-1",
      updatedBy: "system",
    });
    expect(published).toMatchObject({ status: "published", latestVersionId: "version-1" });

    const archived = await repository.archiveAsset({ assetId: asset.id, updatedBy: "system" });
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).toEqual(expect.any(String));
  });
});
