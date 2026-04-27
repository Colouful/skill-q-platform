import type {
  HubAgentProfile,
  HubAgentProfileContent,
  HubAsset,
  HubAssetKind,
  HubAssetVersion,
  HubManifest,
  HubManifestAsset,
  HubManifestVersion,
  HubScope,
} from "../types";
import type { HubAuditLog } from "../audit-log-types";

export type PaginatedResult<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type PaginationQuery = {
  page?: number | string;
  pageSize?: number | string;
};

export type AssetListQuery = PaginationQuery & {
  keyword?: string;
  kind?: string;
  status?: string;
  scope?: string;
  ownerTeamId?: string;
  ownerUserId?: string;
  tag?: string;
};

export type ManifestListQuery = PaginationQuery & {
  keyword?: string;
  status?: string;
  scope?: string;
  ownerTeamId?: string;
  techStack?: string;
  projectKind?: string;
  tag?: string;
};

export type AgentProfileListQuery = PaginationQuery & {
  keyword?: string;
  status?: string;
  riskLevel?: string;
  defaultExecutor?: string;
  ownerTeamId?: string;
};

export type InstallRecordListQuery = PaginationQuery & {
  manifestSlug?: string;
  status?: string;
};

export type RuntimeFeedbackListQuery = PaginationQuery & {
  manifestSlug?: string;
  success?: string | boolean;
  executorType?: string;
};

export type AuditLogListQuery = PaginationQuery & {
  targetType?: string;
  targetId?: string;
  action?: string;
  operatorId?: string;
};

export type HubAssetSummary = Omit<HubAsset, "ownerOrgId" | "ownerTeamId" | "ownerUserId" | "createdBy" | "updatedBy"> & {
  versionCount: number;
  publishedVersionCount: number;
};

export type HubAssetDetail = HubAsset;

export type CreateAssetInput = {
  slug: string;
  name: string;
  kind: HubAssetKind;
  scope: HubScope;
  status?: HubAsset["status"];
  description?: string;
  tags?: unknown[];
  visibility?: string | null;
  ownerOrgId?: string | null;
  ownerTeamId?: string | null;
  ownerUserId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UpdateAssetDraftInput = {
  assetId: string;
  name?: string;
  description?: string;
  tags?: unknown[];
  visibility?: string | null;
  ownerTeamId?: string | null;
  ownerUserId?: string | null;
  updatedBy?: string | null;
};

export type ArchiveAssetInput = {
  assetId: string;
  archivedAt?: string;
  updatedBy?: string | null;
};

export type MarkAssetPublishedInput = {
  assetId: string;
  latestVersionId: string;
  updatedBy?: string | null;
};

export type HubAssetVersionSummary = Omit<HubAssetVersion, "content" | "dependencies" | "compatibility">;

export type HubAssetVersionDetail = HubAssetVersion;

export type CreateAssetVersionInput = {
  assetId: string;
  version: string;
  content: string;
  contentFormat: HubAssetVersion["contentFormat"];
  checksum: string;
  status?: HubAssetVersion["status"];
  immutable?: boolean;
  qualityScore?: number;
  dependencies?: unknown[];
  compatibility?: Record<string, unknown>;
  changelog?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
  source?: string | null;
  contentSize?: number;
  previousVersionId?: string | null;
};

export type PublishAssetVersionInput = {
  assetId: string;
  versionId: string;
  checksum: string;
  contentSize: number;
  publishedAt?: string;
  publishedBy?: string | null;
};

export type DeprecateAssetVersionInput = {
  assetId: string;
  versionId: string;
};

export type SubmitAssetVersionReviewInput = {
  assetId: string;
  versionId: string;
};

export type RejectAssetVersionReviewInput = {
  assetId: string;
  versionId: string;
  rejectedAt?: string;
  rejectedReason?: string | null;
};

export type HubAssetManifestRef = {
  manifestId: string;
  manifestSlug: string;
  manifestVersionId: string;
  manifestVersion: string;
  assetVersionId: string;
  kind: string;
  required: boolean;
};

export type HubManifestSummary = Omit<HubManifest, "ownerOrgId" | "ownerTeamId" | "createdBy" | "updatedBy"> & {
  versionCount: number;
  publishedVersionCount: number;
  assetBindingCount: number;
};

export type HubManifestDetail = HubManifest;

export type CreateManifestInput = {
  slug: string;
  name: string;
  scope: HubScope;
  status?: HubManifest["status"];
  description?: string;
  tags?: unknown[];
  techStacks?: unknown[];
  projectKinds?: unknown[];
  recommendedFor?: unknown[];
  ownerOrgId?: string | null;
  ownerTeamId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UpdateManifestDraftInput = {
  manifestId: string;
  name?: string;
  description?: string;
  tags?: unknown[];
  techStacks?: unknown[];
  projectKinds?: unknown[];
  recommendedFor?: unknown[];
  ownerTeamId?: string | null;
  updatedBy?: string | null;
};

export type ArchiveManifestInput = {
  manifestId: string;
  archivedAt?: string;
  updatedBy?: string | null;
};

export type MarkManifestPublishedInput = {
  manifestId: string;
  latestVersionId: string;
  updatedBy?: string | null;
};

export type HubManifestVersionSummary = Omit<HubManifestVersion, "compatibility" | "installPolicy"> & {
  installPolicy: HubManifestVersion["installPolicy"];
  compatibility: HubManifestVersion["compatibility"];
  assetBindingCount: number;
};

export type HubManifestVersionDetail = HubManifestVersion;

export type CreateManifestVersionInput = {
  manifestId: string;
  version: string;
  status?: HubManifestVersion["status"];
  checksum?: string;
  installPolicy?: HubManifestVersion["installPolicy"];
  compatibility?: Record<string, unknown>;
  changelog?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
  previousVersionId?: string | null;
  exportSchemaVersion?: string | null;
};

export type PublishManifestVersionInput = {
  manifestId: string;
  versionId: string;
  checksum: string;
  publishedAt?: string;
  publishedBy?: string | null;
};

export type DeprecateManifestVersionInput = {
  manifestId: string;
  versionId: string;
};

export type UpdateManifestVersionChecksumInput = {
  manifestId: string;
  versionId: string;
  checksum: string;
};

export type SubmitManifestVersionReviewInput = {
  manifestId: string;
  versionId: string;
};

export type RejectManifestVersionReviewInput = {
  manifestId: string;
  versionId: string;
  rejectedAt?: string;
  rejectedReason?: string | null;
};

export type HubManifestAssetBinding = HubManifestAsset & {
  assetSlug: string;
  assetName: string;
  assetVersion: string;
  checksum: string;
};

export type CreateManifestAssetBindingInput = {
  manifestVersionId: string;
  assetId: string;
  assetVersionId: string;
  kind: HubAssetKind;
  required?: boolean;
  loadWhen?: string[];
  order?: number;
  alias?: string | null;
  reason?: string | null;
  stage?: string | null;
  addedBy?: string | null;
  addedAt?: string | null;
  policy?: Record<string, unknown> | null;
};

export type HubAgentProfileSummary = Omit<HubAgentProfile, "content" | "description" | "ownerOrgId" | "createdBy" | "publishedBy"> & {
  defaultExecutor: string;
  deniedTools: string[];
};

export type HubAgentProfileDetail = HubAgentProfile;

export type CreateAgentProfileInput = {
  slug: string;
  name: string;
  description?: string;
  version: string;
  scope: HubScope;
  status?: HubAgentProfile["status"];
  content: HubAgentProfileContent;
  checksum: string;
  ownerOrgId?: string | null;
  ownerTeamId?: string | null;
  ownerUserId?: string | null;
  riskLevel?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
};

export type UpdateAgentProfileDraftInput = {
  profileId: string;
  name?: string;
  description?: string;
  content?: HubAgentProfileContent;
  checksum?: string;
  ownerTeamId?: string | null;
  ownerUserId?: string | null;
  riskLevel?: string | null;
};

export type PublishAgentProfileInput = {
  profileId: string;
  checksum: string;
  publishedAt?: string;
  publishedBy?: string | null;
};

export type DeprecateAgentProfileInput = {
  profileId: string;
  deprecatedAt?: string;
};

export type ArchiveAgentProfileInput = {
  profileId: string;
  archivedAt?: string;
};

export type SubmitAgentProfileReviewInput = {
  profileId: string;
};

export type RejectAgentProfileReviewInput = {
  profileId: string;
  rejectedAt?: string;
  rejectedReason?: string | null;
};

export type HubInstallRecordSummary = {
  id: string;
  projectId: string;
  workspaceId: string | null;
  manifestSlug: string;
  manifestVersion: string;
  manifestChecksum?: string;
  status: string;
  failureReason?: string;
  packageCount: number;
  clientName: string;
  clientVersion: string;
  installedAt: string;
  createdAt: string;
};

export type HubRuntimeFeedbackSummary = {
  id: string;
  projectId: string;
  runId: string;
  manifestSlug: string;
  manifestVersion: string;
  success: boolean;
  durationMs: number;
  executorType: string;
  failureCategory?: string;
  assetSlugs: unknown[];
  privacyChecked: boolean;
  createdAt: string;
};

export type HubAuditLogSummary = HubAuditLog;

export type HubAuditLogCreateInput = Omit<HubAuditLogSummary, "id" | "createdAt" | "operator"> & {
  id?: string;
  createdAt?: string;
};

export type RepositoryMode = "memory" | "prisma";

export type PrismaDelegateLike = {
  findMany(args?: unknown): Promise<unknown[]>;
  findFirst(args?: unknown): Promise<unknown | null>;
  findUnique(args?: unknown): Promise<unknown | null>;
  count(args?: unknown): Promise<number>;
  create(args?: unknown): Promise<unknown>;
  update?(args?: unknown): Promise<unknown>;
  delete?(args?: unknown): Promise<unknown>;
  updateMany?(args?: unknown): Promise<unknown>;
};

export type PrismaHubClientLike = {
  hubAsset: PrismaDelegateLike;
  hubAssetVersion: PrismaDelegateLike;
  hubManifest: PrismaDelegateLike;
  hubManifestVersion: PrismaDelegateLike;
  hubManifestAsset: PrismaDelegateLike;
  hubAgentProfile: PrismaDelegateLike;
  hubInstallRecord: PrismaDelegateLike;
  hubRuntimeFeedback: PrismaDelegateLike;
  hubAuditLog: PrismaDelegateLike;
};

export type PrismaTransactionHubClientLike = PrismaHubClientLike;

export type PrismaTransactionalHubClientLike = PrismaHubClientLike & {
  $transaction<T>(handler: (tx: PrismaTransactionHubClientLike) => Promise<T>): Promise<T>;
};

export function parsePagination(query: PaginationQuery = {}) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("分页参数不合法：page 必须大于 0，pageSize 必须在 1 到 100 之间。");
  }
  return { page, pageSize };
}

export function paginate<T>(items: T[], query: PaginationQuery = {}): PaginatedResult<T> {
  const { page, pageSize } = parsePagination(query);
  const total = items.length;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total },
  };
}
