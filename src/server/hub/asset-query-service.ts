import { ASSET_ERROR } from "./asset-governance-errors";
import { normalizeKind, normalizeStatus, serializeAsset } from "./asset-admin-shared";
import type { HubRepository } from "./repository";
import { InMemoryHubRepositoryAdapter } from "./repositories/memory/in-memory-hub-repository-adapter";
import { getHubRepositoryProvider } from "./repositories/hub-repository-provider";
import type { AssetRepositoryPort } from "./repositories/ports/asset-repository-port";
import type { AssetListQuery, HubAssetSummary, HubAssetVersionSummary } from "./repositories/repository-types";
import type { HubScope } from "./types";

function isHubRepository(repo: unknown): repo is HubRepository {
  return Boolean(repo && typeof repo === "object" && Array.isArray((repo as HubRepository).assets));
}

function toRepository(repo?: HubRepository | AssetRepositoryPort): AssetRepositoryPort {
  if (!repo) return getHubRepositoryProvider();
  if (isHubRepository(repo)) return new InMemoryHubRepositoryAdapter(repo);
  return repo as AssetRepositoryPort;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function readQuery(input: URLSearchParams | Record<string, string | undefined>): AssetListQuery {
  const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
  const page = Number(get("page") ?? 1);
  const pageSize = Number(get("pageSize") ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw ASSET_ERROR.invalidPagination();
  }
  const kind = get("kind") || undefined;
  const status = get("status") || undefined;
  if (kind) normalizeKind(kind);
  if (status) normalizeStatus(status);
  return {
    keyword: get("keyword")?.trim() || undefined,
    kind,
    status,
    scope: (get("scope") as HubScope | undefined) || undefined,
    ownerTeamId: get("ownerTeamId") || undefined,
    ownerUserId: get("ownerUserId") || undefined,
    tag: get("tag") || undefined,
    page,
    pageSize,
  };
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

function serializeAssetSummary(asset: HubAssetSummary) {
  return {
    id: asset.id,
    slug: asset.slug,
    name: asset.name,
    kind: asset.kind,
    scope: asset.scope,
    status: asset.status,
    visibility: asset.visibility ?? undefined,
    tags: toStringArray(asset.tags),
    description: asset.description,
    latestVersionId: asset.latestVersionId ?? undefined,
    deprecatedAt: asset.deprecatedAt ?? undefined,
    archivedAt: asset.archivedAt ?? undefined,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    versionCount: asset.versionCount,
    publishedVersionCount: asset.publishedVersionCount,
  };
}

export class AssetQueryService {
  private readonly repository: AssetRepositoryPort;

  constructor(repo?: HubRepository | AssetRepositoryPort) {
    this.repository = toRepository(repo);
  }

  async list(input: URLSearchParams | Record<string, string | undefined>) {
    const result = await this.repository.listAssets(readQuery(input));
    return {
      ...result,
      items: result.items.map(serializeAssetSummary),
    };
  }

  async detail(assetId: string) {
    const asset = await this.repository.findAssetById(assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    const [versions, manifestRefs] = await Promise.all([
      this.repository.listAssetVersions(asset.id),
      this.repository.listAssetManifestRefs(asset.id),
    ]);
    return {
      asset: serializeAsset(asset),
      versions: versions.map(serializeRepositoryVersionSummary),
      manifestRefs,
      stats: {
        versionCount: versions.length,
        publishedVersionCount: versions.filter((version) => version.status === "published").length,
        manifestRefCount: manifestRefs.length,
      },
    };
  }

  async listAssetVersions(assetId: string) {
    const asset = await this.repository.findAssetById(assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    const versions = await this.repository.listAssetVersions(asset.id);
    return versions.map(serializeRepositoryVersionSummary);
  }

  async findAssetVersionById(versionId: string) {
    const version = await this.repository.findAssetVersionById(versionId);
    if (!version) throw ASSET_ERROR.versionNotFound();
    return {
      ...serializeRepositoryVersionSummary(version),
      content: version.content,
      dependencies: version.dependencies,
      compatibility: version.compatibility,
    };
  }
}
