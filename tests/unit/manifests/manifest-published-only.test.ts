import { describe, expect, it } from "vitest";
import { AssetService } from "@/server/hub/asset-service";
import { ManifestExportService } from "@/server/hub/manifest-export-service";
import { createHubRepository } from "@/server/hub/repository";

function createPublishedManifest(repo = createHubRepository()) {
  const manifest = repo.createManifest({ slug: "test-manifest", name: "测试 Manifest", status: "published" });
  const manifestVersion = repo.createManifestVersion({
    manifestId: manifest.id,
    version: "1.0.0",
    status: "published",
  });
  return { repo, manifest, manifestVersion };
}

describe("Manifest published-only 规则", () => {
  it("Manifest 不能导出 draft asset version", () => {
    const { repo, manifest, manifestVersion } = createPublishedManifest();
    const assetService = new AssetService(repo);
    const asset = assetService.createDraftAsset({ slug: "draft-rule", name: "草稿规则", kind: "rule" });
    const version = assetService.createVersion({
      assetSlug: "draft-rule",
      version: "0.1.0",
      content: "# Draft\n",
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: asset.id,
      assetVersionId: version.id,
      kind: "rule",
    });

    expect(() => new ManifestExportService(repo).export({ slug: manifest.slug })).toThrow("Manifest 引用了未发布资产");
  });

  it("Manifest Export 只应包含 published asset version", () => {
    const { repo, manifest, manifestVersion } = createPublishedManifest();
    const assetService = new AssetService(repo);
    const asset = assetService.createDraftAsset({ slug: "published-role", name: "已发布角色", kind: "role" });
    const version = assetService.createVersion({
      assetSlug: "published-role",
      version: "1.0.0",
      content: "# Published\n",
      status: "published",
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: asset.id,
      assetVersionId: version.id,
      kind: "role",
    });

    const payload = new ManifestExportService(repo).export({ slug: manifest.slug });

    expect(payload.assets).toHaveLength(1);
    expect(payload.assets[0]).toEqual(
      expect.objectContaining({
        slug: "published-role",
        version: "1.0.0",
        checksum: version.checksum,
      }),
    );
  });

  it("deprecated asset version 不应被新 Manifest 默认绑定", () => {
    const { repo, manifestVersion } = createPublishedManifest();
    const assetService = new AssetService(repo);
    const asset = assetService.createDraftAsset({ slug: "deprecated-rule", name: "废弃规则", kind: "rule" });
    const version = assetService.createVersion({
      assetSlug: "deprecated-rule",
      version: "1.0.0",
      content: "# Deprecated\n",
      status: "published",
    });
    version.status = "deprecated";

    expect(() =>
      repo.linkManifestAsset({
        manifestVersionId: manifestVersion.id,
        assetId: asset.id,
        assetVersionId: version.id,
        kind: "rule",
      }),
    ).toThrow("已废弃资产不应新绑定到 Manifest");
  });

  it("archived asset version 不允许新绑定", () => {
    const { repo, manifestVersion } = createPublishedManifest();
    const assetService = new AssetService(repo);
    const asset = assetService.createDraftAsset({ slug: "archived-flow", name: "归档流程", kind: "flow" });
    const version = assetService.createVersion({
      assetSlug: "archived-flow",
      version: "1.0.0",
      content: "# Archived\n",
      status: "published",
    });
    version.status = "archived";

    expect(() =>
      repo.linkManifestAsset({
        manifestVersionId: manifestVersion.id,
        assetId: asset.id,
        assetVersionId: version.id,
        kind: "flow",
      }),
    ).toThrow("已归档资产不允许新绑定到 Manifest");
  });
});
