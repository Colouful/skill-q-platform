import { AgentProfileGovernanceService } from "./agent-profile-governance-service";
import { serializeAgentProfileDetail, validateAgentProfileContent } from "./agent-profile-admin-shared";
import { assertSafeAdminPayload, serializeVersionDetail } from "./asset-admin-shared";
import { AssetVersionService } from "./asset-version-service";
import { AuditLogService } from "./audit-log-service";
import { computeManifestVersionChecksum, serializeManifestVersionSummary } from "./manifest-admin-shared";
import { ManifestVersionService } from "./manifest-version-service";
import { REVIEW_ERROR } from "./review-workflow-errors";
import type { HubAuditTargetType } from "./audit-log-types";
import type { HubRepository } from "./repository";
import type { HubStatus } from "./types";

function noteOf(input: Record<string, unknown>) {
  const note = String(input.note ?? input.publishNote ?? "").trim();
  return note || undefined;
}

function transitionAllowedForSubmit(status: HubStatus) {
  return status === "draft" || status === "rejected";
}

export class ReviewWorkflowService {
  constructor(
    private readonly repo: HubRepository,
    private readonly auditLogService = new AuditLogService(),
  ) {}

  submitAssetVersion(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    const asset = this.repo.assets.find((item) => item.id === assetId);
    const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    if (!asset || !version) throw REVIEW_ERROR.targetNotFound();
    if (asset.status === "archived" || version.status === "archived") throw REVIEW_ERROR.archivedLocked();
    if (!transitionAllowedForSubmit(version.status)) throw REVIEW_ERROR.submitNotAllowed();
    const statusFrom = version.status;
    version.status = "reviewing";
    version.rejectedAt = null;
    version.rejectedReason = null;
    if (asset.status === "draft" || asset.status === "rejected") asset.status = "reviewing";
    this.audit("asset-version", version.id, "submit-review", statusFrom, version.status, input);
    return { version: serializeVersionDetail(version) };
  }

  rejectAssetVersion(assetId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw REVIEW_ERROR.reasonRequired();
    const asset = this.repo.assets.find((item) => item.id === assetId);
    const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    if (!asset || !version) throw REVIEW_ERROR.targetNotFound();
    if (version.status !== "reviewing") throw REVIEW_ERROR.rejectNotAllowed();
    const statusFrom = version.status;
    version.status = "rejected";
    version.rejectedAt = new Date().toISOString();
    version.rejectedReason = reason;
    if (asset.status !== "published") asset.status = "rejected";
    this.audit("asset-version", version.id, "reject", statusFrom, version.status, { ...input, reason });
    return { version: serializeVersionDetail(version) };
  }

  publishAssetVersion(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
    const version = this.repo.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    const statusFrom = version?.status;
    const result = new AssetVersionService(this.repo).publish(assetId, versionId, input);
    this.audit("asset-version", versionId, "publish", statusFrom, "published", input);
    return result;
  }

  submitManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!manifest || !version) throw REVIEW_ERROR.targetNotFound();
    if (manifest.status === "archived" || version.status === "archived") throw REVIEW_ERROR.archivedLocked();
    if (!transitionAllowedForSubmit(version.status)) throw REVIEW_ERROR.submitNotAllowed();
    const statusFrom = version.status;
    version.status = "reviewing";
    version.rejectedAt = null;
    version.rejectedReason = null;
    if (manifest.status === "draft" || manifest.status === "rejected") manifest.status = "reviewing";
    this.audit("manifest-version", version.id, "submit-review", statusFrom, version.status, input);
    return { version: serializeManifestVersionSummary(this.repo, version) };
  }

  rejectManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw REVIEW_ERROR.reasonRequired();
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!manifest || !version) throw REVIEW_ERROR.targetNotFound();
    if (version.status !== "reviewing") throw REVIEW_ERROR.rejectNotAllowed();
    const statusFrom = version.status;
    version.status = "rejected";
    version.rejectedAt = new Date().toISOString();
    version.rejectedReason = reason;
    if (manifest.status !== "published") manifest.status = "rejected";
    this.audit("manifest-version", version.id, "reject", statusFrom, version.status, { ...input, reason });
    return { version: serializeManifestVersionSummary(this.repo, version) };
  }

  publishManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    const statusFrom = version?.status;
    const result = new ManifestVersionService(this.repo).publish(manifestId, versionId, input);
    this.audit("manifest-version", versionId, "publish", statusFrom, "published", input);
    return result;
  }

  submitAgentProfile(profileId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw REVIEW_ERROR.targetNotFound();
    if (profile.status === "archived") throw REVIEW_ERROR.archivedLocked();
    if (!transitionAllowedForSubmit(profile.status)) throw REVIEW_ERROR.submitNotAllowed();
    const statusFrom = profile.status;
    profile.status = "reviewing";
    profile.rejectedAt = null;
    profile.rejectedReason = null;
    profile.updatedAt = new Date().toISOString();
    this.audit("agent-profile", profile.id, "submit-review", statusFrom, profile.status, input);
    return serializeAgentProfileDetail(profile);
  }

  rejectAgentProfile(profileId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw REVIEW_ERROR.reasonRequired();
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw REVIEW_ERROR.targetNotFound();
    if (profile.status !== "reviewing") throw REVIEW_ERROR.rejectNotAllowed();
    const statusFrom = profile.status;
    profile.status = "rejected";
    profile.rejectedAt = new Date().toISOString();
    profile.rejectedReason = reason;
    profile.updatedAt = new Date().toISOString();
    this.audit("agent-profile", profile.id, "reject", statusFrom, profile.status, { ...input, reason });
    return serializeAgentProfileDetail(profile);
  }

  publishAgentProfile(profileId: string, input: Record<string, unknown> = {}) {
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    const statusFrom = profile?.status;
    if (profile) {
      const validation = validateAgentProfileContent(profile.content);
      if (!validation.valid) throw REVIEW_ERROR.publishNotAllowed();
    }
    const result = new AgentProfileGovernanceService(this.repo).publish(profileId, input);
    this.audit("agent-profile", profileId, "publish", statusFrom, "published", input);
    return result;
  }

  getPublishChecks(targetType: HubAuditTargetType, targetId: string) {
    if (targetType === "asset-version") {
      const version = this.repo.assetVersions.find((item) => item.id === targetId);
      return {
        targetType,
        targetId,
        checks: [
          { label: "content 不为空", passed: Boolean(version?.content.trim()) },
          { label: "checksum 存在", passed: Boolean(version?.checksum) },
          { label: "状态允许发布", passed: version?.status === "draft" || version?.status === "reviewing" },
        ],
      };
    }
    if (targetType === "manifest-version") {
      const version = this.repo.manifestVersions.find((item) => item.id === targetId);
      const links = this.repo.manifestAssets.filter((item) => item.manifestVersionId === targetId);
      return {
        targetType,
        targetId,
        checks: [
          { label: "至少一个 required asset", passed: links.some((item) => item.required) },
          { label: "绑定资产均已发布", passed: links.every((link) => this.assetVersionPublished(link.assetVersionId)) },
          { label: "checksum 可生成", passed: Boolean(version && computeManifestVersionChecksum(this.repo, version)) },
        ],
      };
    }
    const profile = this.repo.agentProfiles.find((item) => item.id === targetId);
    const validation = validateAgentProfileContent(profile?.content);
    return {
      targetType,
      targetId,
      checks: [
        { label: "安全策略通过", passed: validation.valid },
        { label: "checksum 存在", passed: Boolean(profile?.checksum) },
        { label: "状态允许发布", passed: profile?.status === "draft" || profile?.status === "reviewing" },
      ],
      errors: validation.errors,
    };
  }

  private assetVersionPublished(assetVersionId: string) {
    const version = this.repo.assetVersions.find((item) => item.id === assetVersionId);
    const asset = this.repo.assets.find((item) => item.id === version?.assetId);
    return Boolean(asset && version && asset.status === "published" && version.status === "published" && version.immutable && version.checksum);
  }

  private audit(
    targetType: HubAuditTargetType,
    targetId: string,
    action: "submit-review" | "reject" | "publish",
    statusFrom: string | undefined,
    statusTo: string,
    input: Record<string, unknown>,
  ) {
    this.auditLogService.append({
      targetType,
      targetId,
      action,
      statusFrom,
      statusTo,
      reason: input.reason ? String(input.reason) : undefined,
      note: noteOf(input),
      operator: "system",
    });
  }
}
