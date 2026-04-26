import type {
  ArchiveManifestInput,
  CreateManifestInput,
  HubManifestAssetBinding,
  HubManifestDetail,
  HubManifestSummary,
  HubManifestVersionDetail,
  HubManifestVersionSummary,
  MarkManifestPublishedInput,
  ManifestListQuery,
  PaginatedResult,
  UpdateManifestDraftInput,
} from "../repository-types";

export type ManifestRepositoryPort = {
  listManifests(query?: ManifestListQuery): Promise<PaginatedResult<HubManifestSummary>>;
  findManifestById(id: string): Promise<HubManifestDetail | null>;
  findManifestBySlug(slug: string): Promise<HubManifestDetail | null>;
  createManifest(input: CreateManifestInput): Promise<HubManifestDetail>;
  updateManifestDraft(input: UpdateManifestDraftInput): Promise<HubManifestDetail>;
  archiveManifest(input: ArchiveManifestInput): Promise<HubManifestDetail>;
  markManifestPublished(input: MarkManifestPublishedInput): Promise<HubManifestDetail>;
  listManifestVersions(manifestId: string): Promise<HubManifestVersionSummary[]>;
  findManifestVersionById(versionId: string): Promise<HubManifestVersionDetail | null>;
  listManifestAssetBindings(manifestVersionId: string): Promise<HubManifestAssetBinding[]>;
};
