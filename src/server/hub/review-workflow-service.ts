import { AgentProfileGovernanceService } from "./agent-profile-governance-service";
import { serializeAgentProfileDetail, validateAgentProfileContent } from "./agent-profile-admin-shared";
import { assertSafeAdminPayload, serializeVersionDetail } from "./asset-admin-shared";
import { AssetVersionService } from "./asset-version-service";
import { AUDIT_LOG_ERROR } from "./audit-log-errors";
import { assertSafeAuditLogPayload } from "./audit-log-privacy";
import { AuditLogService } from "./audit-log-service";
import type { HubAuditTargetType } from "./audit-log-types";
import { computeManifestVersionChecksum } from "./manifest-admin-shared";
import { ManifestVersionService } from "./manifest-version-service";
import type { HubRepository } from "./repository";
import type { HubManifestVersionDetail, HubManifestVersionSummary } from "./repositories/repository-types";
import type { HubTransactionContext } from "./transactions/transaction-context";
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";
import { MemoryTransactionManager } from "./transactions/memory-transaction-manager";
import { REVIEW_ERROR } from "./review-workflow-errors";
import type { HubStatus } from "./types";

type ReviewWorkflowServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type ReviewAction = "submit-review" | "reject";

function noteOf(input: Record<string, unknown>) {
  const note = String(input.note ?? input.publishNote ?? "").trim();
  return note || undefined;
}

function transitionAllowedForSubmit(status: HubStatus) {
  return status === "draft" || status === "rejected";
}

function assertSafeReviewText(value: string | undefined, label: "note" | "reason") {
  if (!value) return;
  const lower = value.toLowerCase();
  const forbidden = ["sourcecode", "sourcecontent", "filecontent", "rawprompt", "rawresponse", "absolutepath", "apikey", "password", "token", "secret"];
  if (forbidden.some((item) => lower.includes(item)) || value.includes("/Users/") || value.includes(".env")) {
    throw AUDIT_LOG_ERROR.privacyViolated(`审核${label === "note" ? "备注" : "原因"}包含敏感内容`);
  }
}

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).assetVersions));
}

function serializeRepositoryManifestVersion(version: HubManifestVersionDetail | HubManifestVersionSummary) {
  const summary = version as HubManifestVersionSummary;
  return {
    id: version.id,
    manifestId: version.manifestId,
    version: version.version,
    status: version.status,
    checksum: version.checksum,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assetBindingCount: "assetBindingCount" in summary ? summary.assetBindingCount : 0,
    exportSchemaVersion: version.exportSchemaVersion ?? undefined,
    changelog: version.changelog ?? undefined,
    previousVersionId: version.previousVersionId ?? undefined,
    rejectedAt: version.rejectedAt ?? undefined,
    rejectedReason: version.rejectedReason ?? undefined,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt ?? undefined,
  };
}

export class ReviewWorkflowService {
  private readonly repo?: HubRepository;
  private readonly transactionManager: TransactionManagerPort;
  private readonly legacyAuditLogService?: AuditLogService;

  constructor(repoOrOptions?: HubRepository | ReviewWorkflowServiceOptions, auditLogService = new AuditLogService()) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
      this.legacyAuditLogService = auditLogService;
      this.transactionManager = new MemoryTransactionManager(repoOrOptions);
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  async submitReview(targetType: string, input: Record<string, unknown> = {}) {
    if (targetType !== "asset-version" && targetType !== "manifest-version" && targetType !== "agent-profile") {
      throw REVIEW_ERROR.invalidTargetType();
    }
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    return { targetType };
  }

  async submitAssetVersion(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const note = noteOf(input);
    assertSafeReviewText(note, "note");
    return this.transactionManager.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      const version = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, versionId);
      if (!asset || !version) throw REVIEW_ERROR.targetNotFound();
      if (asset.status === "archived" || version.status === "archived") throw REVIEW_ERROR.archivedLocked();
      if (!transitionAllowedForSubmit(version.status)) throw REVIEW_ERROR.submitNotAllowed();
      const statusFrom = version.status;
      const updated = await tx.assetVersions.submitAssetVersionReview({ assetId, versionId });
      await this.audit(tx, "asset-version", versionId, "submit-review", statusFrom, "reviewing", {
        targetSlug: asset.slug,
        targetVersion: version.version,
        note,
      });
      return { version: serializeVersionDetail(updated) };
    });
  }

  async rejectAssetVersion(assetId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw REVIEW_ERROR.reasonRequired();
    assertSafeReviewText(reason, "reason");
    return this.transactionManager.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      const version = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, versionId);
      if (!asset || !version) throw REVIEW_ERROR.targetNotFound();
      if (version.status !== "reviewing") throw REVIEW_ERROR.rejectNotAllowed();
      const statusFrom = version.status;
      const updated = await tx.assetVersions.rejectAssetVersionReview({
        assetId,
        versionId,
        rejectedAt: new Date().toISOString(),
        rejectedReason: reason,
      });
      await this.audit(tx, "asset-version", versionId, "reject", statusFrom, "rejected", {
        targetSlug: asset.slug,
        targetVersion: version.version,
        reason,
      });
      return { version: serializeVersionDetail(updated) };
    });
  }

  async publishAssetVersion(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const legacyAsset = this.repo?.assets.find((item) => item.id === assetId);
    const legacyVersion = this.repo?.assetVersions.find((item) => item.assetId === assetId && item.id === versionId);
    const statusFrom = legacyVersion?.status;
    await this.assertAssetVersionReviewing(assetId, versionId);
    const result = await new AssetVersionService({ transactionManager: this.transactionManager }).publish(assetId, versionId, input);
    await this.legacyAuditLogService?.append({
      targetType: "asset-version",
      targetId: versionId,
      targetSlug: legacyAsset?.slug,
      targetVersion: legacyVersion?.version,
      action: "publish",
      statusFrom: statusFrom ?? "reviewing",
      statusTo: "published",
      note: noteOf(input),
      operatorId: "system",
      operatorName: "系统",
      operatorType: "system",
    });
    return result;
  }

  async submitManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const note = noteOf(input);
    assertSafeReviewText(note, "note");
    return this.transactionManager.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!manifest || !version) throw REVIEW_ERROR.targetNotFound();
      if (manifest.status === "archived" || version.status === "archived") throw REVIEW_ERROR.archivedLocked();
      if (!transitionAllowedForSubmit(version.status)) throw REVIEW_ERROR.submitNotAllowed();
      const statusFrom = version.status;
      const updated = await tx.manifestVersions.submitManifestVersionReview({ manifestId, versionId });
      await this.audit(tx, "manifest-version", versionId, "submit-review", statusFrom, "reviewing", {
        targetSlug: manifest.slug,
        targetVersion: version.version,
        note,
      });
      return { version: serializeRepositoryManifestVersion(updated) };
    });
  }

  async rejectManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw REVIEW_ERROR.reasonRequired();
    assertSafeReviewText(reason, "reason");
    return this.transactionManager.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!manifest || !version) throw REVIEW_ERROR.targetNotFound();
      if (version.status !== "reviewing") throw REVIEW_ERROR.rejectNotAllowed();
      const statusFrom = version.status;
      const updated = await tx.manifestVersions.rejectManifestVersionReview({
        manifestId,
        versionId,
        rejectedAt: new Date().toISOString(),
        rejectedReason: reason,
      });
      await this.audit(tx, "manifest-version", versionId, "reject", statusFrom, "rejected", {
        targetSlug: manifest.slug,
        targetVersion: version.version,
        reason,
      });
      return { version: serializeRepositoryManifestVersion(updated) };
    });
  }

  async publishManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const legacyManifest = this.repo?.manifests.find((item) => item.id === manifestId);
    const legacyVersion = this.repo?.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    const statusFrom = legacyVersion?.status;
    await this.assertManifestVersionReviewing(manifestId, versionId);
    const result = await new ManifestVersionService({ transactionManager: this.transactionManager }).publish(manifestId, versionId, input);
    await this.legacyAuditLogService?.append({
      targetType: "manifest-version",
      targetId: versionId,
      targetSlug: legacyManifest?.slug,
      targetVersion: legacyVersion?.version,
      action: "publish",
      statusFrom: statusFrom ?? "reviewing",
      statusTo: "published",
      note: noteOf(input),
      operatorId: "system",
      operatorName: "系统",
      operatorType: "system",
    });
    return result;
  }

  async submitAgentProfile(profileId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const note = noteOf(input);
    assertSafeReviewText(note, "note");
    return this.transactionManager.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw REVIEW_ERROR.targetNotFound();
      if (profile.status === "archived") throw REVIEW_ERROR.archivedLocked();
      if (!transitionAllowedForSubmit(profile.status)) throw REVIEW_ERROR.submitNotAllowed();
      const statusFrom = profile.status;
      const updated = await tx.agentProfiles.submitAgentProfileReview({ profileId });
      await this.audit(tx, "agent-profile", profileId, "submit-review", statusFrom, "reviewing", {
        targetSlug: profile.slug,
        targetVersion: profile.version,
        note,
      });
      return serializeAgentProfileDetail(updated);
    });
  }

  async rejectAgentProfile(profileId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw REVIEW_ERROR.reasonRequired();
    assertSafeReviewText(reason, "reason");
    return this.transactionManager.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw REVIEW_ERROR.targetNotFound();
      if (profile.status !== "reviewing") throw REVIEW_ERROR.rejectNotAllowed();
      const statusFrom = profile.status;
      const updated = await tx.agentProfiles.rejectAgentProfileReview({
        profileId,
        rejectedAt: new Date().toISOString(),
        rejectedReason: reason,
      });
      await this.audit(tx, "agent-profile", profileId, "reject", statusFrom, "rejected", {
        targetSlug: profile.slug,
        targetVersion: profile.version,
        reason,
      });
      return serializeAgentProfileDetail(updated);
    });
  }

  async publishAgentProfile(profileId: string, input: Record<string, unknown> = {}) {
    assertSafeAdminPayload(input);
    assertSafeAuditLogPayload(input);
    const legacyProfile = this.repo?.agentProfiles.find((item) => item.id === profileId);
    const statusFrom = legacyProfile?.status;
    await this.assertAgentProfileReviewing(profileId);
    let result: Awaited<ReturnType<AgentProfileGovernanceService["publish"]>>;
    try {
      result = await new AgentProfileGovernanceService({ transactionManager: this.transactionManager }).publish(profileId, input);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "AGENT_PROFILE_SECURITY_POLICY_INVALID") {
        throw REVIEW_ERROR.publishNotAllowed();
      }
      throw error;
    }
    await this.legacyAuditLogService?.append({
      targetType: "agent-profile",
      targetId: profileId,
      targetSlug: legacyProfile?.slug,
      targetVersion: legacyProfile?.version,
      action: "publish",
      statusFrom: statusFrom ?? "reviewing",
      statusTo: "published",
      note: noteOf(input),
      operatorId: "system",
      operatorName: "系统",
      operatorType: "system",
    });
    return result;
  }

  getPublishChecks(targetType: HubAuditTargetType, targetId: string) {
    if (!this.repo) throw REVIEW_ERROR.targetNotFound();
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
    const version = this.repo?.assetVersions.find((item) => item.id === assetVersionId);
    const asset = this.repo?.assets.find((item) => item.id === version?.assetId);
    return Boolean(asset && version && asset.status === "published" && version.status === "published" && version.immutable && version.checksum);
  }

  private async assertAssetVersionReviewing(assetId: string, versionId: string) {
    await this.transactionManager.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      const version = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, versionId);
      if (!asset || !version) throw REVIEW_ERROR.targetNotFound();
      if (asset.status === "archived" || version.status === "archived") throw REVIEW_ERROR.archivedLocked();
      if (version.status !== "reviewing") throw REVIEW_ERROR.publishNotAllowed();
    });
  }

  private async assertManifestVersionReviewing(manifestId: string, versionId: string) {
    await this.transactionManager.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!manifest || !version) throw REVIEW_ERROR.targetNotFound();
      if (manifest.status === "archived" || version.status === "archived") throw REVIEW_ERROR.archivedLocked();
      if (version.status !== "reviewing") throw REVIEW_ERROR.publishNotAllowed();
    });
  }

  private async assertAgentProfileReviewing(profileId: string) {
    await this.transactionManager.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw REVIEW_ERROR.targetNotFound();
      if (profile.status === "archived") throw REVIEW_ERROR.archivedLocked();
      if (profile.status !== "reviewing") throw REVIEW_ERROR.publishNotAllowed();
    });
  }

  private async audit(
    tx: HubTransactionContext,
    targetType: HubAuditTargetType,
    targetId: string,
    action: ReviewAction,
    statusFrom: string | undefined,
    statusTo: string,
    input: { targetSlug?: string; targetVersion?: string; reason?: string; note?: string },
  ) {
    const auditInput = {
      targetType,
      targetId,
      targetSlug: input.targetSlug,
      targetVersion: input.targetVersion,
      action,
      statusFrom,
      statusTo,
      reason: input.reason,
      note: input.note,
      operatorId: "system",
      operatorName: "系统",
      operatorType: "system",
    };
    await tx.auditLogs.createAuditLog(auditInput);
    await this.legacyAuditLogService?.append(auditInput);
  }
}
