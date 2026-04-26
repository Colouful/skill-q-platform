import type {
  AssetListQuery,
  ArchiveAssetInput,
  CreateAssetInput,
  HubAssetDetail,
  HubAssetManifestRef,
  HubAssetSummary,
  HubAssetVersionDetail,
  HubAssetVersionSummary,
  MarkAssetPublishedInput,
  PaginatedResult,
  UpdateAssetDraftInput,
} from "../repository-types";

export type AssetRepositoryPort = {
  listAssets(query?: AssetListQuery): Promise<PaginatedResult<HubAssetSummary>>;
  findAssetById(id: string): Promise<HubAssetDetail | null>;
  findAssetBySlug(slug: string): Promise<HubAssetDetail | null>;
  listAssetVersions(assetId: string): Promise<HubAssetVersionSummary[]>;
  findAssetVersionById(versionId: string): Promise<HubAssetVersionDetail | null>;
  listAssetManifestRefs(assetId: string): Promise<HubAssetManifestRef[]>;
  createAsset(input: CreateAssetInput): Promise<HubAssetDetail>;
  updateAssetDraft(input: UpdateAssetDraftInput): Promise<HubAssetDetail>;
  archiveAsset(input: ArchiveAssetInput): Promise<HubAssetDetail>;
  markAssetPublished(input: MarkAssetPublishedInput): Promise<HubAssetDetail>;
};
