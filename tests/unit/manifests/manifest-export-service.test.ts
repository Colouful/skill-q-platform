import { describe, expect, it } from "vitest";
import { AssetService } from "@/server/hub/asset-service";
import { ManifestExportService } from "@/server/hub/manifest-export-service";
import { createHubRepository } from "@/server/hub/repository";
import { createSeededHubRepository } from "@/server/hub/seed";

describe("ManifestExportService", () => {
  it("Manifest Export 成功并包含 checksum / contentUrl / installPolicy", () => {
    const payload = new ManifestExportService(createSeededHubRepository()).export({
      slug: "frontend-react-nextjs-standard",
      version: "1.0.0",
    });

    expect(payload.schemaVersion).toBe("1.0.0");
    expect(payload.manifest.checksum).toMatch(/^sha256:/);
    expect(payload.manifest.installPolicy.defaultExecutor).toBe("cursor");
    expect(payload.assets[0].contentUrl).toContain("/api/hub/assets/");
    expect(payload.agentProfiles[0].contentUrl).toContain("/api/hub/agent-profiles/");
  });

  it("draft Manifest 不允许 export", () => {
    const repo = createHubRepository();
    repo.createManifest({ slug: "draft-only", name: "草稿 Manifest", status: "draft" });

    expect(() => new ManifestExportService(repo).export({ slug: "draft-only" })).toThrow("Manifest 尚未发布");
  });

  it("Manifest 引用 draft asset 时失败", () => {
    const repo = createHubRepository();
    const assetService = new AssetService(repo);
    const asset = assetService.createDraftAsset({ slug: "draft-asset", name: "草稿资产", kind: "rule" });
    const assetVersion = assetService.createVersion({ assetSlug: asset.slug, version: "1.0.0", content: "# Draft\n" });
    const manifest = repo.createManifest({ slug: "bad-manifest", name: "错误 Manifest", status: "published" });
    const manifestVersion = repo.createManifestVersion({
      manifestId: manifest.id,
      version: "1.0.0",
      status: "published",
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: asset.id,
      assetVersionId: assetVersion.id,
      kind: "rule",
    });

    expect(() => new ManifestExportService(repo).export({ slug: manifest.slug })).toThrow("Manifest 引用了未发布资产");
  });
});
