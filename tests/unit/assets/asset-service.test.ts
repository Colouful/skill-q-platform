import { describe, expect, it } from "vitest";
import { AssetService } from "@/server/hub/asset-service";
import { sha256Text } from "@/server/hub/checksum";
import { createHubRepository } from "@/server/hub/repository";
import { ManifestExportService } from "@/server/hub/manifest-export-service";

describe("AssetService", () => {
  it("可以创建 draft asset", () => {
    const repo = createHubRepository();
    const asset = new AssetService(repo).createDraftAsset({
      slug: "test-rule",
      name: "测试规则",
      kind: "rule",
    });

    expect(asset.status).toBe("draft");
    expect(asset.slug).toBe("test-rule");
  });

  it("发布 asset version 后 immutable=true 且 checksum 稳定", () => {
    const repo = createHubRepository();
    const service = new AssetService(repo);
    service.createDraftAsset({ slug: "test-skill", name: "测试 Skill", kind: "skill" });
    const version = service.createVersion({
      assetSlug: "test-skill",
      version: "1.0.0",
      content: "# Skill\n",
    });
    const published = service.publishVersion({ assetSlug: "test-skill", version: "1.0.0" });

    expect(version.checksum).toBe(sha256Text("# Skill\n"));
    expect(published.immutable).toBe(true);
    expect(published.status).toBe("published");
  });

  it("published asset 不可修改 content", () => {
    const repo = createHubRepository();
    const service = new AssetService(repo);
    service.createDraftAsset({ slug: "immutable-rule", name: "不可变规则", kind: "rule" });
    service.createVersion({
      assetSlug: "immutable-rule",
      version: "1.0.0",
      content: "# Rule\n",
      status: "published",
    });

    expect(() =>
      service.updateVersionContent({
        assetSlug: "immutable-rule",
        version: "1.0.0",
        content: "# Changed\n",
      }),
    ).toThrow("已发布资产版本不可修改 content");
  });

  it("Manifest 引用 draft asset 时 export 失败", () => {
    const repo = createHubRepository();
    const service = new AssetService(repo);
    const asset = service.createDraftAsset({ slug: "draft-rule", name: "草稿规则", kind: "rule" });
    const version = service.createVersion({ assetSlug: "draft-rule", version: "1.0.0", content: "# Draft\n" });
    const manifest = repo.createManifest({ slug: "draft-manifest", name: "草稿引用", status: "published" });
    const manifestVersion = repo.createManifestVersion({
      manifestId: manifest.id,
      version: "1.0.0",
      status: "published",
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: asset.id,
      assetVersionId: version.id,
      kind: "rule",
    });

    expect(() => new ManifestExportService(repo).export({ slug: "draft-manifest", version: "1.0.0" })).toThrow(
      "Manifest 引用了未发布资产",
    );
  });
});
