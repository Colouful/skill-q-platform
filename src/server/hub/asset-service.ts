import { HubError } from "./errors";
import { HubRepository } from "./repository";
import { sha256Text } from "./checksum";
import type { HubAssetKind, HubScope } from "./types";

export class AssetService {
  constructor(private readonly repo: HubRepository) {}

  createDraftAsset(input: {
    slug: string;
    name: string;
    kind: HubAssetKind;
    scope?: HubScope;
    description?: string;
    ownerOrgId?: string | null;
    ownerTeamId?: string | null;
    ownerUserId?: string | null;
  }) {
    if (!input.slug || !input.name) {
      throw new HubError("ASSET_INVALID", "资产 slug 和 name 不能为空", "请补充资产 slug 和名称。", 400);
    }
    return this.repo.createAsset({
      ...input,
      status: "draft",
    });
  }

  createVersion(input: {
    assetSlug: string;
    version: string;
    content: string;
    status?: "draft" | "published";
  }) {
    const asset = this.repo.assets.find((item) => item.slug === input.assetSlug);
    if (!asset) {
      throw new HubError("ASSET_NOT_FOUND", "资产不存在", "请确认资产 slug 是否正确。", 404);
    }
    if (!input.content) {
      throw new HubError("CHECKSUM_REQUIRED", "资产内容不能为空，无法生成 checksum", "请提供资产正文后再发布。", 400);
    }
    const version = this.repo.createAssetVersion({
      assetId: asset.id,
      version: input.version,
      content: input.content,
      status: input.status ?? "draft",
    });
    if (version.status === "published") {
      asset.status = "published";
      asset.updatedAt = new Date().toISOString();
    }
    return version;
  }

  publishVersion(input: { assetSlug: string; version: string }) {
    const asset = this.repo.assets.find((item) => item.slug === input.assetSlug);
    if (!asset) {
      throw new HubError("ASSET_NOT_FOUND", "资产不存在", "请确认资产 slug 是否正确。", 404);
    }
    const version = this.repo.assetVersions.find(
      (item) => item.assetId === asset.id && item.version === input.version,
    );
    if (!version) {
      throw new HubError("ASSET_VERSION_NOT_FOUND", "资产版本不存在", "请确认 version 是否正确。", 404);
    }
    if (!version.checksum) {
      throw new HubError("CHECKSUM_REQUIRED", "资产 checksum 不能为空", "请重新生成 checksum 后再发布。", 400);
    }
    version.status = "published";
    version.immutable = true;
    version.publishedAt = new Date().toISOString();
    asset.status = "published";
    asset.updatedAt = new Date().toISOString();
    return version;
  }

  updateVersionContent(input: { assetSlug: string; version: string; content: string }) {
    const asset = this.repo.assets.find((item) => item.slug === input.assetSlug);
    const version = asset
      ? this.repo.assetVersions.find((item) => item.assetId === asset.id && item.version === input.version)
      : null;
    if (!asset || !version) {
      throw new HubError("ASSET_VERSION_NOT_FOUND", "资产版本不存在", "请确认资产 slug 和 version。", 404);
    }
    if (version.status === "published" || version.immutable) {
      throw new HubError(
        "PUBLISHED_ASSET_IMMUTABLE",
        "已发布资产版本不可修改 content",
        "请创建新的资产版本。",
        409,
      );
    }
    version.content = input.content;
    version.checksum = sha256Text(input.content);
    version.contentSize = input.content.length;
    return version;
  }

  getPublishedContent(input: { slug: string; version?: string }) {
    const asset = this.repo.assets.find((item) => item.slug === input.slug);
    if (!asset) {
      throw new HubError("ASSET_NOT_FOUND", "资产不存在", "请确认资产 slug 是否正确。", 404);
    }
    const versions = this.repo.assetVersions
      .filter((item) => item.assetId === asset.id && item.status === "published")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const version = input.version ? versions.find((item) => item.version === input.version) : versions[0];
    if (!version) {
      throw new HubError("ASSET_VERSION_NOT_FOUND", "资产发布版本不存在", "请确认 version 是否已发布。", 404);
    }
    return {
      slug: asset.slug,
      version: version.version,
      kind: asset.kind,
      contentFormat: version.contentFormat,
      content: version.content,
      checksum: version.checksum,
    };
  }
}
