import { sha256Text } from "./checksum";
import { ASSET_ERROR } from "./asset-governance-errors";
import {
  assertSafeAdminPayload,
  normalizeContentFormat,
  serializeVersionDetail,
  serializeVersionSummary,
} from "./asset-admin-shared";
import type { HubRepository } from "./repository";
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";
import type { HubAssetVersionDetail, HubAssetVersionSummary } from "./repositories/repository-types";

type AssetVersionServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type VersionListResponse = { items: ReturnType<typeof serializeRepositoryVersionSummary>[] };
type VersionDetailResponse = { version: ReturnType<typeof serializeRepositoryVersionDetail> };

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).assetVersions));
}

function serializeRepositoryVersionSummary(version: HubAssetVersionSummary) {
  return {
    id: version.id,
    assetId: version.assetId,
    version: version.version,
    status: version.status,
    immutable: version.immutable,
    checksum: version.checksum,
    contentFormat: version.contentFormat,
    contentSize: version.contentSize ?? 0,
    qualityScore: version.qualityScore,
    changelog: version.changelog ?? undefined,
    source: version.source ?? undefined,
    previousVersionId: version.previousVersionId ?? undefined,
    rejectedAt: version.rejectedAt ?? undefined,
    rejectedReason: version.rejectedReason ?? undefined,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt ?? undefined,
  };
}

function serializeRepositoryVersionDetail(version: HubAssetVersionDetail) {
  return serializeVersionDetail(version);
}

export class AssetVersionService {
  private readonly repo?: HubRepository;
  private readonly transactionManager?: TransactionManagerPort;

  constructor(repoOrOptions?: HubRepository | AssetVersionServiceOptions) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  list(assetId: string): VersionListResponse {
    if (this.repo) {
      const asset = this.repo.assets.find((item) => item.id === assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      const items = this.repo.assetVersions.filter((item) => item.assetId === assetId).map(serializeVersionSummary);
      return { items };
    }

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      const items = await tx.assets.listAssetVersions(assetId);
      return { items: items.map(serializeRepositoryVersionSummary) };
    }) as unknown as VersionListResponse;
  }

  create(assetId: string, input: Record<string, unknown>): VersionDetailResponse {
    assertSafeAdminPayload(input);
    if (this.repo) {
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

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      if (asset.status === "archived") throw ASSET_ERROR.archived();
      const versionValue = String(input.version ?? "").trim();
      const content = String(input.content ?? "");
      if (!versionValue) throw ASSET_ERROR.versionCreateInvalid("资产版本 version 不能为空");
      if (!content.trim()) throw ASSET_ERROR.contentRequired();
      if (await tx.assetVersions.findAssetVersionByAssetAndVersion(assetId, versionValue)) {
        throw ASSET_ERROR.versionExists();
      }
      const checksum = sha256Text(content);
      const version = await tx.assetVersions.createAssetVersion({
        assetId,
        version: versionValue,
        content,
        contentFormat: normalizeContentFormat(input.contentFormat),
        checksum,
        contentSize: content.length,
        status: "draft",
        immutable: false,
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
      return { version: serializeRepositoryVersionDetail(version) };
    }) as unknown as VersionDetailResponse;
  }

  detail(assetId: string, versionId: string): VersionDetailResponse {
    if (this.repo) {
      this.assertAsset(assetId);
      const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
      if (!version) throw ASSET_ERROR.versionNotFound();
      return { version: serializeVersionDetail(version) };
    }

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      const version = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, versionId);
      if (!version) throw ASSET_ERROR.versionNotFound();
      return { version: serializeRepositoryVersionDetail(version) };
    }) as unknown as VersionDetailResponse;
  }

  publish(assetId: string, versionId: string, input: Record<string, unknown> = {}): VersionDetailResponse {
    assertSafeAdminPayload(input);
    if (this.repo) {
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

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      if (asset.status === "archived") throw ASSET_ERROR.archived();
      const version = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, versionId);
      if (!version) throw ASSET_ERROR.versionNotFound();
      if (version.status !== "draft" && version.status !== "reviewing") throw ASSET_ERROR.publishNotAllowed();
      if (!version.content.trim()) throw ASSET_ERROR.contentRequired();
      const statusFrom = version.status;
      const checksum = sha256Text(version.content);
      if (!checksum) throw ASSET_ERROR.checksumRequired();
      const publishedAt = new Date().toISOString();
      const published = await tx.assetVersions.publishAssetVersion({
        assetId,
        versionId,
        checksum,
        contentSize: version.content.length,
        publishedAt,
        publishedBy: "system",
      });
      await tx.assets.markAssetPublished({
        assetId,
        latestVersionId: versionId,
        updatedBy: "system",
      });
      await tx.auditLogs.createAuditLog({
        targetType: "asset-version",
        targetId: versionId,
        targetSlug: asset.slug,
        targetVersion: version.version,
        action: "publish",
        statusFrom,
        statusTo: "published",
        note: input.publishNote ? String(input.publishNote) : undefined,
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return { version: serializeRepositoryVersionDetail(published) };
    }) as unknown as VersionDetailResponse;
  }

  deprecate(assetId: string, versionId: string, input: Record<string, unknown>): VersionDetailResponse {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw ASSET_ERROR.versionCreateInvalid("废弃原因不能为空");
    if (this.repo) {
      this.assertAsset(assetId);
      const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
      if (!version) throw ASSET_ERROR.versionNotFound();
      if (version.status !== "published") throw ASSET_ERROR.deprecateNotAllowed();
      version.status = "deprecated";
      return { version: serializeVersionDetail(version) };
    }

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      const version = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, versionId);
      if (!version) throw ASSET_ERROR.versionNotFound();
      if (version.status !== "published") throw ASSET_ERROR.deprecateNotAllowed();
      const deprecated = await tx.assetVersions.deprecateAssetVersion({ assetId, versionId });
      return { version: serializeRepositoryVersionDetail(deprecated) };
    }) as unknown as VersionDetailResponse;
  }

  private assertAsset(assetId: string) {
    const asset = this.repo?.assets.find((item) => item.id === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    return asset;
  }
}
