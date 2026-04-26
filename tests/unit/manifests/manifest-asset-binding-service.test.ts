import { describe, expect, it } from "vitest";
import { ManifestAssetBindingService } from "@/server/hub/manifest-asset-binding-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createManifestFixture, createPublishedAsset } from "./manifest-test-fixtures";

describe("ManifestAssetBindingService", () => {
  it("应绑定 published asset version", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);

    const result = bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: asset.asset.id,
      assetVersionId: asset.version.id,
      kind: "role",
      required: true,
      loadWhen: ["planning"],
      order: 10,
    });

    expect(result.binding).toEqual(
      expect.objectContaining({
        assetSlug: asset.asset.slug,
        assetVersion: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        required: true,
        order: 10,
      }),
    );
  });

  it("绑定 draft asset version 应失败", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = repo.createAsset({ slug: "draft-bind-asset", name: "草稿资产", kind: "role", status: "published" });
    const version = repo.createAssetVersion({ assetId: asset.id, version: "0.1.0", content: "# Draft\n" });

    expect(() =>
      bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
        assetId: asset.id,
        assetVersionId: version.id,
        kind: "role",
      }),
    ).toThrow("Manifest 只能绑定已发布资产版本");
  });

  it("绑定 archived asset 应失败", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);
    repo.assets.find((item) => item.id === asset.asset.id)!.status = "archived";

    expect(() =>
      bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
        assetId: asset.asset.id,
        assetVersionId: asset.version.id,
        kind: "role",
      }),
    ).toThrow("已归档资产不允许绑定到 Manifest");
  });

  it("重复绑定同一 asset version 应失败", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);
    const input = { assetId: asset.asset.id, assetVersionId: asset.version.id, kind: "role" };

    bindingService.bind(manifest.manifest.id, manifestVersion.version.id, input);

    expect(() => bindingService.bind(manifest.manifest.id, manifestVersion.version.id, input)).toThrow(
      "Manifest 已绑定该资产版本",
    );
  });

  it("kind 和 asset.kind 不一致时应失败", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo, "flow");

    expect(() =>
      bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
        assetId: asset.asset.id,
        assetVersionId: asset.version.id,
        kind: "role",
      }),
    ).toThrow("绑定 kind 必须与资产 kind 一致");
  });

  it("应解绑 asset binding 并重算 checksum", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);
    const binding = bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: asset.asset.id,
      assetVersionId: asset.version.id,
      kind: "role",
    });

    const result = bindingService.unbind(manifest.manifest.id, manifestVersion.version.id, binding.binding!.bindingId);

    expect(result.removed).toBe(true);
    expect(repo.manifestAssets).toHaveLength(0);
    expect(result.checksum).toMatch(/^sha256:/);
  });

  it("published manifest version 不允许解绑和排序", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const asset = createPublishedAsset(repo);
    const binding = bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: asset.asset.id,
      assetVersionId: asset.version.id,
      kind: "role",
      required: true,
    });
    new ManifestVersionService(repo).publish(manifest.manifest.id, manifestVersion.version.id, {});

    expect(() => bindingService.unbind(manifest.manifest.id, manifestVersion.version.id, binding.binding!.bindingId)).toThrow(
      "当前 Manifest 版本状态不允许修改资产绑定",
    );
    expect(() =>
      bindingService.reorder(manifest.manifest.id, manifestVersion.version.id, {
        items: [{ bindingId: binding.binding!.bindingId, order: 20 }],
      }),
    ).toThrow("当前 Manifest 版本状态不允许修改资产绑定");
  });

  it("应调整 asset binding 顺序", () => {
    const { repo, manifest, versionService } = createManifestFixture();
    const bindingService = new ManifestAssetBindingService(repo);
    const manifestVersion = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    const role = createPublishedAsset(repo, "role");
    const flow = createPublishedAsset(repo, "flow");
    const first = bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: role.asset.id,
      assetVersionId: role.version.id,
      kind: "role",
      order: 10,
    });
    const second = bindingService.bind(manifest.manifest.id, manifestVersion.version.id, {
      assetId: flow.asset.id,
      assetVersionId: flow.version.id,
      kind: "flow",
      order: 20,
    });

    const reordered = bindingService.reorder(manifest.manifest.id, manifestVersion.version.id, {
      items: [
        { bindingId: first.binding!.bindingId, order: 30 },
        { bindingId: second.binding!.bindingId, order: 5 },
      ],
    });

    expect(reordered.items.map((item) => item.order)).toEqual([5, 30]);
    expect(reordered.checksum).toMatch(/^sha256:/);
  });
});
