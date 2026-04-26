import { sha256Text } from "./checksum";
import { ASSET_ERROR } from "./asset-governance-errors";
import {
  assertSafeAdminPayload,
  normalizeContentFormat,
  serializeVersionDetail,
  serializeVersionSummary,
} from "./asset-admin-shared";
import type { HubRepository } from "./repository";

export class AssetVersionService {
  constructor(private readonly repo: HubRepository) {}

  list(assetId: string) {
    const asset = this.repo.assets.find((item) => item.id === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    const items = this.repo.assetVersions.filter((item) => item.assetId === assetId).map(serializeVersionSummary);
    return { items };
  }

  create(assetId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const asset = this.repo.assets.find((item) => item.id === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    if (asset.status === "archived") throw ASSET_ERROR.archived();
    const versionValue = String(input.version ?? "").trim();
    const content = String(input.content ?? "");
    if (!versionValue) throw ASSET_ERROR.versionCreateInvalid("资产版本 version 不能为空");
    if (!content.trim()) throw ASSET_ERROR.contentRequired();
    if (this.repo.assetVersions.some((version) => version.assetId === assetId && version.version === versionValue)) {
      throw ASSET_ERROR.versionExists();
    }
    const version = this.repo.createAssetVersion({
      assetId,
      version: versionValue,
      content,
      contentFormat: normalizeContentFormat(input.contentFormat),
      status: "draft",
      qualityScore: Number(input.qualityScore ?? 0),
      dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
      compatibility:
        input.compatibility && typeof input.compatibility === "object" && !Array.isArray(input.compatibility)
          ? (input.compatibility as Record<string, unknown>)
          : {},
      changelog: input.changelog ? String(input.changelog) : null,
      createdBy: "system",
      source: input.source ? String(input.source) : null,
      previousVersionId: input.previousVersionId ? String(input.previousVersionId) : null,
    });
    return { version: serializeVersionDetail(version) };
  }

  detail(assetId: string, versionId: string) {
    this.assertAsset(assetId);
    const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    if (!version) throw ASSET_ERROR.versionNotFound();
    return { version: serializeVersionDetail(version) };
  }

  publish(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    const asset = this.assertAsset(assetId);
    if (asset.status === "archived") throw ASSET_ERROR.archived();
    const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    if (!version) throw ASSET_ERROR.versionNotFound();
    if (version.status !== "draft" && version.status !== "reviewing") throw ASSET_ERROR.publishNotAllowed();
    if (!version.content.trim()) throw ASSET_ERROR.contentRequired();
    const checksum = sha256Text(version.content);
    if (!checksum) throw ASSET_ERROR.checksumRequired();
    version.checksum = checksum;
    version.contentSize = version.content.length;
    version.status = "published";
    version.immutable = true;
    version.publishedAt = new Date().toISOString();
    version.publishedBy = "system";
    asset.status = "published";
    asset.latestVersionId = version.id;
    asset.updatedAt = new Date().toISOString();
    asset.updatedBy = "system";
    return { version: serializeVersionDetail(version) };
  }

  deprecate(assetId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw ASSET_ERROR.versionCreateInvalid("废弃原因不能为空");
    this.assertAsset(assetId);
    const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    if (!version) throw ASSET_ERROR.versionNotFound();
    if (version.status !== "published") throw ASSET_ERROR.deprecateNotAllowed();
    version.status = "deprecated";
    return { version: serializeVersionDetail(version) };
  }

  private assertAsset(assetId: string) {
    const asset = this.repo.assets.find((item) => item.id === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    return asset;
  }
}
