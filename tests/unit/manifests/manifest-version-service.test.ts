import { describe, expect, it } from "vitest";
import { ManifestAssetBindingService } from "@/server/hub/manifest-asset-binding-service";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { createManifestFixture, createPublishedAsset } from "./manifest-test-fixtures";

describe("ManifestVersionService", () => {
  it("应创建 manifest version 并使用默认 installPolicy", () => {
    const { manifest, versionService } = createManifestFixture();

    const result = versionService.create(manifest.manifest.id, { version: "1.0.0" });

    expect(result.version).toEqual(
      expect.objectContaining({
        version: "1.0.0",
        status: "draft",
        checksum: expect.stringMatching(/^sha256:/),
        installPolicy: { defaultExecutor: "cursor", fallbackExecutors: ["claude-code", "codex"] },
      }),
    );
  });

  it("version 重复时应报 MANIFEST_VERSION_ALREADY_EXISTS", () => {
    const { manifest, versionService } = createManifestFixture();

    versionService.create(manifest.manifest.id, { version: "1.0.0" });

    expect(() => versionService.create(manifest.manifest.id, { version: "1.0.0" })).toThrow("Manifest 版本已存在");
  });

  it("没有 required asset 时发布失败", () => {
    const { manifest, versionService } = createManifestFixture();
    const version = versionService.create(manifest.manifest.id, { version: "1.0.0" });

    expect(() => versionService.publish(manifest.manifest.id, version.version.id, {})).toThrow(
      "Manifest 至少需要绑定一个 required asset",
    );
  });

  it("发布 manifest version 成功并更新 manifest latestVersionId", () => {
    const repo = createHubRepository();
    const manifestService = new ManifestGovernanceService(repo);
    const versionService = new ManifestVersionService(repo);
    const bindingService = new ManifestAssetBindingService(repo);
    const manifest = manifestService.createDraft({ slug: "publish-manifest", name: "发布 Manifest", scope: "platform" });
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);
    bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: asset.asset.id,
      assetVersionId: asset.version.id,
      kind: "role",
      required: true,
    });

    const published = versionService.publish(manifest.manifest.id, manifestVersion.version.id, {});
    const storedManifest = repo.manifests.find((item) => item.id === manifest.manifest.id);

    expect(published.version.status).toBe("published");
    expect(published.version.checksum).toMatch(/^sha256:/);
    expect(storedManifest?.status).toBe("published");
    expect(storedManifest?.latestVersionId).toBe(manifestVersion.version.id);
  });

  it("绑定 draft asset 时发布失败", () => {
    const repo = createHubRepository();
    const manifestService = new ManifestGovernanceService(repo);
    const versionService = new ManifestVersionService(repo);
    const manifest = manifestService.createDraft({ slug: "publish-draft-asset", name: "草稿资产", scope: "platform" });
    const version = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = repo.createAsset({ slug: "draft-asset", name: "草稿资产", kind: "role", status: "published" });
    const assetVersion = repo.createAssetVersion({ assetId: asset.id, version: "0.1.0", content: "# Draft\n" });
    repo.linkManifestAsset({
      manifestVersionId: version.version.id,
      assetId: asset.id,
      assetVersionId: assetVersion.id,
      kind: "role",
      required: true,
    });

    expect(() => versionService.publish(manifest.manifest.id, version.version.id, {})).toThrow("Manifest 只能绑定已发布资产版本");
  });

  it("废弃 published manifest version 不改变绑定资产 checksum", () => {
    const repo = createHubRepository();
    const manifestService = new ManifestGovernanceService(repo);
    const versionService = new ManifestVersionService(repo);
    const bindingService = new ManifestAssetBindingService(repo);
    const manifest = manifestService.createDraft({ slug: "deprecate-manifest", name: "废弃 Manifest", scope: "platform" });
    const version = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);
    bindingService.bind(manifest.manifest.id, version.version.id, {
      assetId: asset.asset.id,
      assetVersionId: asset.version.id,
      kind: "role",
      required: true,
    });
    const checksum = asset.version.checksum;
    versionService.publish(manifest.manifest.id, version.version.id, {});

    const deprecated = versionService.deprecate(manifest.manifest.id, version.version.id, { reason: "已有新版本" });

    expect(deprecated.version.status).toBe("deprecated");
    expect(asset.version.checksum).toBe(checksum);
  });

  it("archived manifest 不允许新增 version", () => {
    const { manifest, manifestService, versionService } = createManifestFixture();
    manifestService.archive(manifest.manifest.id, { reason: "归档" });

    expect(() => versionService.create(manifest.manifest.id, { version: "1.0.0" })).toThrow("Manifest 已归档");
  });
});
