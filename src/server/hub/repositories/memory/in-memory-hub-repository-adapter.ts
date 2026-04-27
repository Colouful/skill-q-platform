import { randomUUID } from "node:crypto";
import type { HubAuditLog } from "../../audit-log-types";
import { assertSafeAuditLogPayload } from "../../audit-log-privacy";
import { createHubRepository, type HubRepository } from "../../repository";
import type {
  HubAgentProfile,
  HubAgentProfileContent,
  HubAsset,
  HubAssetVersion,
  HubInstallRecord,
  HubManifest,
  HubManifestAsset,
  HubManifestVersion,
  HubRuntimeFeedback,
} from "../../types";
import type { HubRepositoryPort } from "../ports/hub-repository-port";
import type {
  AgentProfileListQuery,
  ArchiveAssetInput,
  ArchiveManifestInput,
  AssetListQuery,
  AuditLogListQuery,
  ArchiveAgentProfileInput,
  CreateAgentProfileInput,
  CreateAssetInput,
  CreateAssetVersionInput,
  CreateManifestAssetBindingInput,
  CreateManifestInput,
  CreateManifestVersionInput,
  DeprecateAgentProfileInput,
  DeprecateAssetVersionInput,
  DeprecateManifestVersionInput,
  HubAgentProfileSummary,
  HubAssetManifestRef,
  HubAssetSummary,
  HubAssetVersionSummary,
  HubAuditLogCreateInput,
  HubInstallRecordSummary,
  HubManifestAssetBinding,
  HubManifestSummary,
  HubManifestVersionSummary,
  HubRuntimeFeedbackSummary,
  InstallRecordListQuery,
  MarkAssetPublishedInput,
  MarkManifestPublishedInput,
  ManifestListQuery,
  PublishAgentProfileInput,
  PublishManifestVersionInput,
  PublishAssetVersionInput,
  RejectAgentProfileReviewInput,
  RejectAssetVersionReviewInput,
  RejectManifestVersionReviewInput,
  RuntimeFeedbackListQuery,
  SubmitAgentProfileReviewInput,
  SubmitAssetVersionReviewInput,
  SubmitManifestVersionReviewInput,
  UpdateAgentProfileDraftInput,
  UpdateAssetDraftInput,
  UpdateManifestDraftInput,
  UpdateManifestVersionChecksumInput,
} from "../repository-types";
import { paginate } from "../repository-types";

function includeKeyword(text: string, keyword?: string) {
  const value = keyword?.trim().toLowerCase();
  if (!value) return true;
  return text.toLowerCase().includes(value);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function assetSummary(repo: HubRepository, asset: HubAsset): HubAssetSummary {
  const versions = repo.assetVersions.filter((version) => version.assetId === asset.id);
  return {
    ...asset,
    versionCount: versions.length,
    publishedVersionCount: versions.filter((version) => version.status === "published").length,
  };
}

function assetVersionSummary(version: HubAssetVersion): HubAssetVersionSummary {
  return {
    id: version.id,
    assetId: version.assetId,
    version: version.version,
    contentFormat: version.contentFormat,
    checksum: version.checksum,
    status: version.status,
    immutable: version.immutable,
    qualityScore: version.qualityScore,
    changelog: version.changelog,
    createdBy: version.createdBy,
    publishedBy: version.publishedBy,
    rejectedAt: version.rejectedAt,
    rejectedReason: version.rejectedReason,
    source: version.source,
    contentSize: version.contentSize,
    previousVersionId: version.previousVersionId,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt,
  };
}

function manifestSummary(repo: HubRepository, manifest: HubManifest): HubManifestSummary {
  const versions = repo.manifestVersions.filter((version) => version.manifestId === manifest.id);
  const versionIds = new Set(versions.map((version) => version.id));
  return {
    ...manifest,
    versionCount: versions.length,
    publishedVersionCount: versions.filter((version) => version.status === "published").length,
    assetBindingCount: repo.manifestAssets.filter((binding) => versionIds.has(binding.manifestVersionId)).length,
  };
}

function manifestVersionSummary(repo: HubRepository, version: HubManifestVersion): HubManifestVersionSummary {
  return {
    ...version,
    assetBindingCount: repo.manifestAssets.filter((binding) => binding.manifestVersionId === version.id).length,
  };
}

function manifestAssetBinding(repo: HubRepository, binding: HubManifestAsset): HubManifestAssetBinding | null {
  const asset = repo.assets.find((item) => item.id === binding.assetId);
  const version = repo.assetVersions.find((item) => item.id === binding.assetVersionId);
  if (!asset || !version) return null;
  return {
    ...binding,
    assetSlug: asset.slug,
    assetName: asset.name,
    assetVersion: version.version,
    checksum: version.checksum,
  };
}

function agentProfileSummary(profile: HubAgentProfile): HubAgentProfileSummary {
  return {
    id: profile.id,
    slug: profile.slug,
    name: profile.name,
    scope: profile.scope,
    status: profile.status,
    version: profile.version,
    checksum: profile.checksum,
    ownerTeamId: profile.ownerTeamId,
    ownerUserId: profile.ownerUserId,
    riskLevel: profile.riskLevel,
    rejectedAt: profile.rejectedAt,
    rejectedReason: profile.rejectedReason,
    deprecatedAt: profile.deprecatedAt,
    archivedAt: profile.archivedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    publishedAt: profile.publishedAt,
    defaultExecutor: profile.content.defaultExecutor,
    deniedTools: profile.content.deniedTools,
  };
}

function installRecordSummary(record: HubInstallRecord): HubInstallRecordSummary {
  return {
    id: record.id,
    projectId: record.projectId,
    workspaceId: record.workspaceId,
    manifestSlug: record.manifestSlug ?? record.manifest.slug,
    manifestVersion: record.manifestVersion ?? record.manifest.version,
    manifestChecksum: record.manifestChecksum ?? undefined,
    status: record.status ?? "accepted",
    failureReason: record.failureReason ?? undefined,
    packageCount: record.packageCount ?? record.packages.length,
    clientName: record.clientName ?? record.client.name,
    clientVersion: record.clientVersion ?? record.client.version,
    installedAt: record.installedAt,
    createdAt: record.createdAt,
  };
}

function runtimeFeedbackSummary(record: HubRuntimeFeedback): HubRuntimeFeedbackSummary {
  return {
    id: record.id,
    projectId: record.projectId,
    runId: record.runId,
    manifestSlug: record.manifestSlug ?? record.manifest.slug,
    manifestVersion: record.manifestVersion ?? record.manifest.version,
    success: record.success ?? record.result.success,
    durationMs: record.durationMs ?? record.result.durationMs,
    executorType: record.executorType ?? record.executor,
    failureCategory: record.failureCategory ?? undefined,
    assetSlugs: record.assetSlugs ?? [],
    privacyChecked: record.privacyChecked ?? true,
    createdAt: record.createdAt,
  };
}

export class InMemoryHubRepositoryAdapter implements HubRepositoryPort {
  private readonly auditLogs: HubAuditLog[] = [];

  constructor(readonly repo: HubRepository = createHubRepository()) {}

  async listAssets(query: AssetListQuery = {}) {
    const filtered = this.repo.assets.filter((asset) => {
      if (!includeKeyword(`${asset.slug} ${asset.name} ${asset.description}`, query.keyword)) return false;
      if (query.kind && asset.kind !== query.kind) return false;
      if (query.status && asset.status !== query.status) return false;
      if (query.scope && asset.scope !== query.scope) return false;
      if (query.ownerTeamId && asset.ownerTeamId !== query.ownerTeamId) return false;
      if (query.ownerUserId && asset.ownerUserId !== query.ownerUserId) return false;
      if (query.tag && !stringArray(asset.tags).includes(query.tag)) return false;
      return true;
    });
    return paginate(filtered.map((asset) => assetSummary(this.repo, asset)), query);
  }

  async findAssetById(id: string) {
    return this.repo.assets.find((asset) => asset.id === id) ?? null;
  }

  async findAssetBySlug(slug: string) {
    return this.repo.assets.find((asset) => asset.slug === slug) ?? null;
  }

  async createAsset(input: CreateAssetInput) {
    return this.repo.createAsset(input);
  }

  async updateAssetDraft(input: UpdateAssetDraftInput) {
    const asset = this.repo.assets.find((item) => item.id === input.assetId);
    if (!asset) return Promise.reject(new Error("资产不存在"));
    if (input.name !== undefined) asset.name = input.name;
    if (input.description !== undefined) asset.description = input.description;
    if (input.tags !== undefined) asset.tags = input.tags;
    if (input.visibility !== undefined) asset.visibility = input.visibility;
    if (input.ownerTeamId !== undefined) asset.ownerTeamId = input.ownerTeamId;
    if (input.ownerUserId !== undefined) asset.ownerUserId = input.ownerUserId;
    if (asset.status === "rejected") asset.status = "draft";
    asset.updatedBy = input.updatedBy ?? "system";
    asset.updatedAt = new Date().toISOString();
    return asset;
  }

  async archiveAsset(input: ArchiveAssetInput) {
    const asset = this.repo.assets.find((item) => item.id === input.assetId);
    if (!asset) return Promise.reject(new Error("资产不存在"));
    asset.status = "archived";
    asset.archivedAt = input.archivedAt ?? new Date().toISOString();
    asset.updatedBy = input.updatedBy ?? "system";
    asset.updatedAt = new Date().toISOString();
    return asset;
  }

  async markAssetPublished(input: MarkAssetPublishedInput) {
    const asset = this.repo.assets.find((item) => item.id === input.assetId);
    if (!asset) return Promise.reject(new Error("资产不存在"));
    asset.status = "published";
    asset.latestVersionId = input.latestVersionId;
    asset.updatedBy = input.updatedBy ?? "system";
    asset.updatedAt = new Date().toISOString();
    return asset;
  }

  async listAssetVersions(assetId: string) {
    return this.repo.assetVersions.filter((version) => version.assetId === assetId).map(assetVersionSummary);
  }

  async findAssetVersionById(versionId: string) {
    return this.repo.assetVersions.find((version) => version.id === versionId) ?? null;
  }

  async createAssetVersion(input: CreateAssetVersionInput) {
    return this.repo.createAssetVersion({
      assetId: input.assetId,
      version: input.version,
      content: input.content,
      contentFormat: input.contentFormat,
      status: input.status ?? "draft",
      qualityScore: input.qualityScore,
      dependencies: input.dependencies,
      compatibility: input.compatibility,
      changelog: input.changelog,
      createdBy: input.createdBy,
      publishedBy: input.publishedBy,
      source: input.source,
      previousVersionId: input.previousVersionId,
    });
  }

  async findAssetVersionByAssetAndId(assetId: string, versionId: string) {
    return this.repo.assetVersions.find((version) => version.assetId === assetId && version.id === versionId) ?? null;
  }

  async findAssetVersionByAssetAndVersion(assetId: string, version: string) {
    return this.repo.assetVersions.find((item) => item.assetId === assetId && item.version === version) ?? null;
  }

  async submitAssetVersionReview(input: SubmitAssetVersionReviewInput) {
    const version = this.repo.assetVersions.find((item) => item.assetId === input.assetId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("资产版本不存在"));
    version.status = "reviewing";
    version.rejectedAt = null;
    version.rejectedReason = null;
    return version;
  }

  async rejectAssetVersionReview(input: RejectAssetVersionReviewInput) {
    const version = this.repo.assetVersions.find((item) => item.assetId === input.assetId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("资产版本不存在"));
    version.status = "rejected";
    version.rejectedAt = input.rejectedAt ?? new Date().toISOString();
    version.rejectedReason = input.rejectedReason ?? null;
    return version;
  }

  async publishAssetVersion(input: PublishAssetVersionInput) {
    const version = this.repo.assetVersions.find((item) => item.assetId === input.assetId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("资产版本不存在"));
    version.checksum = input.checksum;
    version.contentSize = input.contentSize;
    version.status = "published";
    version.immutable = true;
    version.publishedAt = input.publishedAt ?? new Date().toISOString();
    version.publishedBy = input.publishedBy ?? "system";
    return version;
  }

  async deprecateAssetVersion(input: DeprecateAssetVersionInput) {
    const version = this.repo.assetVersions.find((item) => item.assetId === input.assetId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("资产版本不存在"));
    version.status = "deprecated";
    return version;
  }

  async listAssetManifestRefs(assetId: string): Promise<HubAssetManifestRef[]> {
    return this.repo.manifestAssets
      .filter((link) => link.assetId === assetId)
      .map((link) => {
        const manifestVersion = this.repo.manifestVersions.find((item) => item.id === link.manifestVersionId);
        const manifest = this.repo.manifests.find((item) => item.id === manifestVersion?.manifestId);
        return {
          manifestId: manifest?.id ?? "",
          manifestSlug: manifest?.slug ?? "",
          manifestVersionId: manifestVersion?.id ?? "",
          manifestVersion: manifestVersion?.version ?? "",
          assetVersionId: link.assetVersionId,
          kind: link.kind,
          required: link.required,
        };
      });
  }

  async listManifests(query: ManifestListQuery = {}) {
    const filtered = this.repo.manifests.filter((manifest) => {
      if (!includeKeyword(`${manifest.slug} ${manifest.name} ${manifest.description}`, query.keyword)) return false;
      if (query.status && manifest.status !== query.status) return false;
      if (query.scope && manifest.scope !== query.scope) return false;
      if (query.ownerTeamId && manifest.ownerTeamId !== query.ownerTeamId) return false;
      if (query.techStack && !stringArray(manifest.techStacks).includes(query.techStack)) return false;
      if (query.projectKind && !stringArray(manifest.projectKinds).includes(query.projectKind)) return false;
      if (query.tag && !stringArray(manifest.tags).includes(query.tag)) return false;
      return true;
    });
    return paginate(filtered.map((manifest) => manifestSummary(this.repo, manifest)), query);
  }

  async findManifestById(id: string) {
    return this.repo.manifests.find((manifest) => manifest.id === id) ?? null;
  }

  async findManifestBySlug(slug: string) {
    return this.repo.manifests.find((manifest) => manifest.slug === slug) ?? null;
  }

  async createManifest(input: CreateManifestInput) {
    return this.repo.createManifest(input);
  }

  async updateManifestDraft(input: UpdateManifestDraftInput) {
    const manifest = this.repo.manifests.find((item) => item.id === input.manifestId);
    if (!manifest) return Promise.reject(new Error("Manifest 不存在"));
    if (input.name !== undefined) manifest.name = input.name;
    if (input.description !== undefined) manifest.description = input.description;
    if (input.tags !== undefined) manifest.tags = input.tags;
    if (input.techStacks !== undefined) manifest.techStacks = input.techStacks;
    if (input.projectKinds !== undefined) manifest.projectKinds = input.projectKinds;
    if (input.recommendedFor !== undefined) manifest.recommendedFor = input.recommendedFor;
    if (input.ownerTeamId !== undefined) manifest.ownerTeamId = input.ownerTeamId;
    if (manifest.status === "rejected") manifest.status = "draft";
    manifest.updatedBy = input.updatedBy ?? "system";
    manifest.updatedAt = new Date().toISOString();
    return manifest;
  }

  async archiveManifest(input: ArchiveManifestInput) {
    const manifest = this.repo.manifests.find((item) => item.id === input.manifestId);
    if (!manifest) return Promise.reject(new Error("Manifest 不存在"));
    manifest.status = "archived";
    manifest.archivedAt = input.archivedAt ?? new Date().toISOString();
    manifest.updatedBy = input.updatedBy ?? "system";
    manifest.updatedAt = new Date().toISOString();
    return manifest;
  }

  async markManifestPublished(input: MarkManifestPublishedInput) {
    const manifest = this.repo.manifests.find((item) => item.id === input.manifestId);
    if (!manifest) return Promise.reject(new Error("Manifest 不存在"));
    manifest.status = "published";
    manifest.latestVersionId = input.latestVersionId;
    manifest.updatedBy = input.updatedBy ?? "system";
    manifest.updatedAt = new Date().toISOString();
    return manifest;
  }

  async listManifestVersions(manifestId: string) {
    return this.repo.manifestVersions
      .filter((version) => version.manifestId === manifestId)
      .map((version) => manifestVersionSummary(this.repo, version));
  }

  async findManifestVersionById(versionId: string) {
    return this.repo.manifestVersions.find((version) => version.id === versionId) ?? null;
  }

  async createManifestVersion(input: CreateManifestVersionInput) {
    const version = this.repo.createManifestVersion({
      manifestId: input.manifestId,
      version: input.version,
      status: input.status ?? "draft",
      installPolicy: input.installPolicy,
      compatibility: input.compatibility,
      changelog: input.changelog,
      createdBy: input.createdBy,
      publishedBy: input.publishedBy,
      previousVersionId: input.previousVersionId,
      exportSchemaVersion: input.exportSchemaVersion,
    });
    if (input.checksum !== undefined) version.checksum = input.checksum;
    return version;
  }

  async findManifestVersionByManifestAndId(manifestId: string, versionId: string) {
    return this.repo.manifestVersions.find((version) => version.manifestId === manifestId && version.id === versionId) ?? null;
  }

  async findManifestVersionByManifestAndVersion(manifestId: string, version: string) {
    return this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.version === version) ?? null;
  }

  async submitManifestVersionReview(input: SubmitManifestVersionReviewInput) {
    const version = this.repo.manifestVersions.find((item) => item.manifestId === input.manifestId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("Manifest 版本不存在"));
    version.status = "reviewing";
    version.rejectedAt = null;
    version.rejectedReason = null;
    return version;
  }

  async rejectManifestVersionReview(input: RejectManifestVersionReviewInput) {
    const version = this.repo.manifestVersions.find((item) => item.manifestId === input.manifestId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("Manifest 版本不存在"));
    version.status = "rejected";
    version.rejectedAt = input.rejectedAt ?? new Date().toISOString();
    version.rejectedReason = input.rejectedReason ?? null;
    return version;
  }

  async publishManifestVersion(input: PublishManifestVersionInput) {
    const version = this.repo.manifestVersions.find((item) => item.manifestId === input.manifestId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("Manifest 版本不存在"));
    version.checksum = input.checksum;
    version.status = "published";
    version.publishedAt = input.publishedAt ?? new Date().toISOString();
    version.publishedBy = input.publishedBy ?? "system";
    return version;
  }

  async deprecateManifestVersion(input: DeprecateManifestVersionInput) {
    const version = this.repo.manifestVersions.find((item) => item.manifestId === input.manifestId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("Manifest 版本不存在"));
    version.status = "deprecated";
    return version;
  }

  async updateManifestVersionChecksum(input: UpdateManifestVersionChecksumInput) {
    const version = this.repo.manifestVersions.find((item) => item.manifestId === input.manifestId && item.id === input.versionId);
    if (!version) return Promise.reject(new Error("Manifest 版本不存在"));
    version.checksum = input.checksum;
    return version;
  }

  async listManifestAssetBindings(manifestVersionId: string) {
    return this.repo.manifestAssets
      .filter((binding) => binding.manifestVersionId === manifestVersionId)
      .sort((a, b) => a.order - b.order)
      .map((binding) => manifestAssetBinding(this.repo, binding))
      .filter((binding): binding is HubManifestAssetBinding => Boolean(binding));
  }

  async createBinding(input: CreateManifestAssetBindingInput) {
    const binding = this.repo.linkManifestAsset(input);
    const serialized = manifestAssetBinding(this.repo, binding);
    if (!serialized) return Promise.reject(new Error("Manifest 资产绑定失败"));
    return serialized;
  }

  async deleteBinding(manifestVersionId: string, bindingId: string) {
    const index = this.repo.manifestAssets.findIndex((item) => item.manifestVersionId === manifestVersionId && item.id === bindingId);
    if (index < 0) return Promise.reject(new Error("Manifest 资产绑定不存在"));
    this.repo.manifestAssets.splice(index, 1);
  }

  async reorderBindings(manifestVersionId: string, items: Array<{ bindingId: string; order: number }>) {
    for (const item of items) {
      const binding = this.repo.manifestAssets.find((link) => link.manifestVersionId === manifestVersionId && link.id === item.bindingId);
      if (!binding) return Promise.reject(new Error("Manifest 资产绑定不存在"));
      binding.order = item.order;
    }
    return this.listManifestAssetBindings(manifestVersionId);
  }

  async findBindingById(manifestVersionId: string, bindingId: string) {
    const binding = this.repo.manifestAssets.find((item) => item.manifestVersionId === manifestVersionId && item.id === bindingId);
    return binding ? manifestAssetBinding(this.repo, binding) : null;
  }

  async findBindingByAssetVersion(manifestVersionId: string, assetVersionId: string) {
    const binding = this.repo.manifestAssets.find((item) => item.manifestVersionId === manifestVersionId && item.assetVersionId === assetVersionId);
    return binding ? manifestAssetBinding(this.repo, binding) : null;
  }

  async listBindingsForChecksum(manifestVersionId: string) {
    return this.listManifestAssetBindings(manifestVersionId);
  }

  async listAgentProfiles(query: AgentProfileListQuery = {}) {
    const filtered = this.repo.agentProfiles.filter((profile) => {
      const content = profile.content as HubAgentProfileContent;
      if (!includeKeyword(`${profile.slug} ${profile.name}`, query.keyword)) return false;
      if (query.status && profile.status !== query.status) return false;
      if (query.riskLevel && (profile.riskLevel ?? content.riskLevel) !== query.riskLevel) return false;
      if (query.defaultExecutor && content.defaultExecutor !== query.defaultExecutor) return false;
      if (query.ownerTeamId && profile.ownerTeamId !== query.ownerTeamId) return false;
      return true;
    });
    return paginate(filtered.map(agentProfileSummary), query);
  }

  async findAgentProfileById(id: string) {
    return this.repo.agentProfiles.find((profile) => profile.id === id) ?? null;
  }

  async findAgentProfileBySlugAndVersion(slug: string, version?: string) {
    return (
      this.repo.agentProfiles.find((profile) => {
        if (profile.slug !== slug) return false;
        return version ? profile.version === version : profile.status === "published";
      }) ??
      this.repo.agentProfiles.find((profile) => profile.slug === slug) ??
      null
    );
  }

  async createAgentProfile(input: CreateAgentProfileInput) {
    const profile = this.repo.createAgentProfile({
      slug: input.slug,
      name: input.name,
      description: input.description,
      version: input.version,
      scope: input.scope,
      status: input.status ?? "draft",
      content: input.content,
      ownerOrgId: input.ownerOrgId,
      ownerTeamId: input.ownerTeamId,
      ownerUserId: input.ownerUserId,
      riskLevel: input.riskLevel,
      createdBy: input.createdBy,
      publishedBy: input.publishedBy,
    });
    profile.checksum = input.checksum;
    return profile;
  }

  async updateAgentProfileDraft(input: UpdateAgentProfileDraftInput) {
    const profile = this.repo.agentProfiles.find((item) => item.id === input.profileId);
    if (!profile) return Promise.reject(new Error("Agent Profile 不存在"));
    if (input.name !== undefined) profile.name = input.name;
    if (input.description !== undefined) profile.description = input.description;
    if (input.ownerTeamId !== undefined) profile.ownerTeamId = input.ownerTeamId;
    if (input.ownerUserId !== undefined) profile.ownerUserId = input.ownerUserId;
    if (input.content !== undefined) profile.content = input.content;
    if (input.riskLevel !== undefined) profile.riskLevel = input.riskLevel;
    if (input.checksum !== undefined) profile.checksum = input.checksum;
    if (profile.status === "rejected") {
      profile.status = "draft";
      profile.rejectedAt = null;
      profile.rejectedReason = null;
    }
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  async submitAgentProfileReview(input: SubmitAgentProfileReviewInput) {
    const profile = this.repo.agentProfiles.find((item) => item.id === input.profileId);
    if (!profile) return Promise.reject(new Error("Agent Profile 不存在"));
    profile.status = "reviewing";
    profile.rejectedAt = null;
    profile.rejectedReason = null;
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  async rejectAgentProfileReview(input: RejectAgentProfileReviewInput) {
    const profile = this.repo.agentProfiles.find((item) => item.id === input.profileId);
    if (!profile) return Promise.reject(new Error("Agent Profile 不存在"));
    profile.status = "rejected";
    profile.rejectedAt = input.rejectedAt ?? new Date().toISOString();
    profile.rejectedReason = input.rejectedReason ?? null;
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  async publishAgentProfile(input: PublishAgentProfileInput) {
    const profile = this.repo.agentProfiles.find((item) => item.id === input.profileId);
    if (!profile) return Promise.reject(new Error("Agent Profile 不存在"));
    profile.checksum = input.checksum;
    profile.status = "published";
    profile.publishedAt = input.publishedAt ?? new Date().toISOString();
    profile.publishedBy = input.publishedBy ?? "system";
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  async deprecateAgentProfile(input: DeprecateAgentProfileInput) {
    const profile = this.repo.agentProfiles.find((item) => item.id === input.profileId);
    if (!profile) return Promise.reject(new Error("Agent Profile 不存在"));
    profile.status = "deprecated";
    profile.deprecatedAt = input.deprecatedAt ?? new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  async archiveAgentProfile(input: ArchiveAgentProfileInput) {
    const profile = this.repo.agentProfiles.find((item) => item.id === input.profileId);
    if (!profile) return Promise.reject(new Error("Agent Profile 不存在"));
    profile.status = "archived";
    profile.archivedAt = input.archivedAt ?? new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    return profile;
  }

  async listInstallRecords(query: InstallRecordListQuery = {}) {
    const filtered = this.repo.installRecords.filter((record) => {
      const manifestSlug = record.manifestSlug ?? record.manifest.slug;
      if (query.manifestSlug && !manifestSlug.includes(query.manifestSlug)) return false;
      if (query.status && record.status !== query.status) return false;
      return true;
    });
    return paginate(filtered.map(installRecordSummary), query);
  }

  async listRuntimeFeedback(query: RuntimeFeedbackListQuery = {}) {
    const success = typeof query.success === "boolean" ? String(query.success) : query.success;
    const filtered = this.repo.runtimeFeedback.filter((record) => {
      const manifestSlug = record.manifestSlug ?? record.manifest.slug;
      if (query.manifestSlug && !manifestSlug.includes(query.manifestSlug)) return false;
      if (success === "true" && (record.success ?? record.result.success) !== true) return false;
      if (success === "false" && (record.success ?? record.result.success) !== false) return false;
      if (query.executorType && (record.executorType ?? record.executor) !== query.executorType) return false;
      return true;
    });
    return paginate(filtered.map(runtimeFeedbackSummary), query);
  }

  async listAuditLogs(query: AuditLogListQuery = {}) {
    const filtered = this.auditLogs.filter((log) => {
      if (query.targetType && log.targetType !== query.targetType) return false;
      if (query.targetId && log.targetId !== query.targetId) return false;
      if (query.action && log.action !== query.action) return false;
      if (query.operatorId && log.operatorId !== query.operatorId) return false;
      return true;
    });
    return paginate(filtered, query);
  }

  async createAuditLog(input: HubAuditLogCreateInput) {
    assertSafeAuditLogPayload(input.metadata);
    const log: HubAuditLog = {
      ...input,
      id: input.id ?? randomUUID(),
      operator: input.operatorName ?? input.operatorId ?? "system",
      operatorId: input.operatorId ?? "system",
      operatorName: input.operatorName ?? "系统",
      operatorType: input.operatorType ?? "system",
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  clearAuditLogs() {
    this.auditLogs.splice(0, this.auditLogs.length);
  }

  getAuditLogsSnapshot() {
    return this.auditLogs.map((log) => ({ ...log, metadata: structuredClone(log.metadata) }));
  }

  restoreAuditLogs(snapshot: HubAuditLog[]) {
    this.auditLogs.splice(0, this.auditLogs.length, ...snapshot.map((log) => ({ ...log, metadata: structuredClone(log.metadata) })));
  }
}
