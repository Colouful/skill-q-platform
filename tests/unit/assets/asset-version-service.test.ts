import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetService } from "@/server/hub/asset-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { createHubRepository } from "@/server/hub/repository";

function createVersionFixture() {
  const repo = createHubRepository();
  const governance = new AssetGovernanceService(repo);
  const versionService = new AssetVersionService(repo);
  const asset = governance.createDraft({ slug: "version-rule", name: "版本规则", kind: "rule", scope: "platform" });
  return { repo, asset, governance, versionService };
}

describe("AssetVersionService", () => {
  it("应创建 asset version 并自动生成 checksum 和 contentSize", () => {
    const { asset, versionService } = createVersionFixture();

    const result = versionService.create(asset.asset.id, {
      version: "1.0.0",
      content: "# Rule\n",
      contentFormat: "markdown",
      changelog: "初始版本",
    });

    expect(result.version).toEqual(
      expect.objectContaining({
        version: "1.0.0",
        status: "draft",
        immutable: false,
        checksum: expect.stringMatching(/^sha256:/),
        contentSize: "# Rule\n".length,
        changelog: "初始版本",
      }),
    );
  });

  it("version 重复时应报 ASSET_VERSION_ALREADY_EXISTS", () => {
    const { asset, versionService } = createVersionFixture();
    const input = { version: "1.0.0", content: "# Rule\n" };

    versionService.create(asset.asset.id, input);

    expect(() => versionService.create(asset.asset.id, input)).toThrow("资产版本已存在");
  });

  it("content 为空时应报 CONTENT_REQUIRED", () => {
    const { asset, versionService } = createVersionFixture();

    expect(() => versionService.create(asset.asset.id, { version: "1.0.0", content: "" })).toThrow(
      "资产版本 content 不能为空",
    );
  });

  it("应发布 draft version 并更新 asset latestVersionId", () => {
    const { repo, asset, versionService } = createVersionFixture();
    const created = versionService.create(asset.asset.id, { version: "1.0.0", content: "# Publish\n" });

    const published = versionService.publish(asset.asset.id, created.version.id, { publishNote: "发布" });
    const storedAsset = repo.assets.find((item) => item.id === asset.asset.id);

    expect(published.version.status).toBe("published");
    expect(published.version.immutable).toBe(true);
    expect(published.version.checksum).toMatch(/^sha256:/);
    expect(storedAsset?.status).toBe("published");
    expect(storedAsset?.latestVersionId).toBe(created.version.id);
  });

  it("published version 不允许通过 AssetService 修改 content", () => {
    const repo = createHubRepository();
    const assetService = new AssetService(repo);
    assetService.createDraftAsset({ slug: "published-immutable", name: "发布不可变", kind: "rule" });
    const version = assetService.createVersion({
      assetSlug: "published-immutable",
      version: "1.0.0",
      content: "# Immutable\n",
      status: "published",
    });

    expect(() =>
      assetService.updateVersionContent({
        assetSlug: "published-immutable",
        version: version.version,
        content: "# Changed\n",
      }),
    ).toThrow("已发布资产版本不可修改 content");
  });

  it("draft version 可通过 AssetService 修改 content", () => {
    const repo = createHubRepository();
    const assetService = new AssetService(repo);
    assetService.createDraftAsset({ slug: "draft-mutable", name: "草稿可变", kind: "rule" });
    const version = assetService.createVersion({
      assetSlug: "draft-mutable",
      version: "0.1.0",
      content: "# Draft\n",
    });
    const oldChecksum = version.checksum;

    const updated = assetService.updateVersionContent({
      assetSlug: "draft-mutable",
      version: version.version,
      content: "# Draft Changed\n",
    });

    expect(updated.content).toBe("# Draft Changed\n");
    expect(updated.checksum).not.toBe(oldChecksum);
  });

  it("废弃 published version 不改变 checksum", () => {
    const { asset, versionService } = createVersionFixture();
    const created = versionService.create(asset.asset.id, { version: "1.0.0", content: "# Deprecated\n" });
    const published = versionService.publish(asset.asset.id, created.version.id, {});
    const checksum = published.version.checksum;

    const deprecated = versionService.deprecate(asset.asset.id, created.version.id, { reason: "已有新版本" });

    expect(deprecated.version.status).toBe("deprecated");
    expect(deprecated.version.checksum).toBe(checksum);
    expect(deprecated.version.content).toBe("# Deprecated\n");
  });

  it("archived asset 不允许新增 version", () => {
    const { asset, governance, versionService } = createVersionFixture();

    governance.archive(asset.asset.id, { reason: "归档测试" });

    expect(() => versionService.create(asset.asset.id, { version: "1.0.0", content: "# Archived\n" })).toThrow(
      "资产已归档",
    );
  });
});
