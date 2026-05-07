import type {
  HubAgentProfile,
  HubAgentProfileContent,
  HubAsset,
  HubAssetKind,
  HubAssetVersion,
  HubInstallRecord,
  HubManifest,
  HubManifestVersion,
  HubRuntimeFeedback,
  HubScope,
  HubStatus,
} from "../../types";
import type { HubAuditLog } from "../../audit-log-types";
import type {
  HubAgentProfileSummary,
  HubAssetManifestRef,
  HubAssetSummary,
  HubAssetVersionSummary,
  HubInstallRecordSummary,
  HubManifestAssetBinding,
  HubManifestSummary,
  HubManifestVersionSummary,
  HubRuntimeFeedbackSummary,
} from "../repository-types";

type PrismaRecord = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  "sourceCode",
  "source_code",
  "sourceContent",
  "source_content",
  "fileContent",
  "file_content",
  "rawPrompt",
  "raw_prompt",
  "rawResponse",
  "raw_response",
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
]);

const ASSET_KINDS = new Set<HubAssetKind>([
  "rule",
  "skill",
  "role",
  "flow",
  "workflow",
  "hook",
  "command",
  "prompt-template",
  "scenario",
  "manifest",
  "agent-profile",
  "tech-profile",
  "source-pack",
  "contract",
]);
const SCOPES = new Set<HubScope>(["platform", "enterprise", "department", "team", "project", "personal"]);
const STATUSES = new Set<HubStatus>(["draft", "reviewing", "published", "active", "deprecated", "archived", "rejected"]);

function asRecord(value: unknown): PrismaRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as PrismaRecord;
}

function asString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  return String(value);
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asJsonArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return sanitizeJson(value) as unknown[];
}

function asJsonRecord(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeJson(value);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) return {};
  return sanitized as Record<string, unknown>;
}

function isAbsolutePath(value: string) {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}

export function sanitizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeJson);
  }
  if (typeof value === "string") {
    return isAbsolutePath(value) ? "[已移除敏感内容]" : value;
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    result[key] = sanitizeJson(child);
  }
  return result;
}

function toIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

function toNullableIso(value: unknown) {
  if (value === null || value === undefined) return null;
  return toIso(value);
}

function toStatus(value: unknown): HubStatus {
  const status = asString(value, "draft");
  return STATUSES.has(status as HubStatus) ? (status as HubStatus) : "draft";
}

function toScope(value: unknown): HubScope {
  const scope = asString(value, "platform");
  return SCOPES.has(scope as HubScope) ? (scope as HubScope) : "platform";
}

function toAssetKind(value: unknown): HubAssetKind {
  const kind = asString(value, "rule");
  return ASSET_KINDS.has(kind as HubAssetKind) ? (kind as HubAssetKind) : "rule";
}

function toContentFormat(value: unknown): HubAssetVersion["contentFormat"] {
  const format = asString(value, "markdown");
  if (format === "json" || format === "yaml") return format;
  return "markdown";
}

function countVersions(record: PrismaRecord) {
  const versions = Array.isArray(record.versions) ? record.versions.map(asRecord) : [];
  return {
    versionCount: versions.length,
    publishedVersionCount: versions.filter((version) => version.status === "published").length,
  };
}

export function mapPrismaAsset(value: unknown): HubAsset {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    slug: asString(record.slug),
    name: asString(record.name),
    kind: toAssetKind(record.kind),
    scope: toScope(record.scope),
    ownerOrgId: asNullableString(record.ownerOrgId),
    ownerTeamId: asNullableString(record.ownerTeamId),
    ownerUserId: asNullableString(record.ownerUserId),
    status: toStatus(record.status),
    description: asString(record.description),
    tags: asJsonArray(record.tags),
    visibility: asNullableString(record.visibility),
    latestVersionId: asNullableString(record.latestVersionId),
    parentAssetId: asNullableString(record.parentAssetId),
    overrideFields: asJsonRecord(record.overrideFields),
    metadata: asJsonRecord(record.metadata),
    deprecatedAt: toNullableIso(record.deprecatedAt),
    archivedAt: toNullableIso(record.archivedAt),
    createdBy: asNullableString(record.createdBy),
    updatedBy: asNullableString(record.updatedBy),
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

export function mapPrismaAssetSummary(value: unknown): HubAssetSummary {
  const record = asRecord(value);
  return {
    ...mapPrismaAsset(record),
    ...countVersions(record),
  };
}

export function mapPrismaAssetVersion(value: unknown): HubAssetVersion {
  const record = asRecord(value);
  const content = asString(sanitizeJson(record.content));
  return {
    id: asString(record.id),
    assetId: asString(record.assetId),
    version: asString(record.version),
    content,
    contentFormat: toContentFormat(record.contentFormat),
    checksum: asString(record.checksum),
    status: toStatus(record.status),
    immutable: asBoolean(record.immutable),
    qualityScore: asNumber(record.qualityScore),
    dependencies: asJsonArray(record.dependencies),
    compatibility: asJsonRecord(record.compatibility),
    changelog: asNullableString(record.changelog),
    createdBy: asNullableString(record.createdBy),
    publishedBy: asNullableString(record.publishedBy),
    rejectedAt: toNullableIso(record.rejectedAt),
    rejectedReason: asNullableString(record.rejectedReason),
    source: asNullableString(record.source),
    contentSize: record.contentSize === null || record.contentSize === undefined ? content.length : asNumber(record.contentSize),
    previousVersionId: asNullableString(record.previousVersionId),
    createdAt: toIso(record.createdAt),
    publishedAt: toNullableIso(record.publishedAt),
  };
}

export function mapPrismaAssetVersionSummary(value: unknown): HubAssetVersionSummary {
  const version = mapPrismaAssetVersion(value);
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

export function mapPrismaAssetManifestRef(value: unknown): HubAssetManifestRef {
  const record = asRecord(value);
  const manifestVersion = asRecord(record.manifestVersion);
  const manifest = asRecord(manifestVersion.manifest);
  return {
    manifestId: asString(manifest.id),
    manifestSlug: asString(manifest.slug),
    manifestVersionId: asString(manifestVersion.id),
    manifestVersion: asString(manifestVersion.version),
    assetVersionId: asString(record.assetVersionId),
    kind: asString(record.kind),
    required: asBoolean(record.required, true),
  };
}

export function mapPrismaManifest(value: unknown): HubManifest {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    slug: asString(record.slug),
    name: asString(record.name),
    scope: toScope(record.scope),
    ownerOrgId: asNullableString(record.ownerOrgId),
    ownerTeamId: asNullableString(record.ownerTeamId),
    status: toStatus(record.status),
    description: asString(record.description),
    tags: asJsonArray(record.tags),
    techStacks: asJsonArray(record.techStacks),
    projectKinds: asJsonArray(record.projectKinds),
    recommendedFor: asJsonArray(record.recommendedFor),
    latestVersionId: asNullableString(record.latestVersionId),
    deprecatedAt: toNullableIso(record.deprecatedAt),
    archivedAt: toNullableIso(record.archivedAt),
    createdBy: asNullableString(record.createdBy),
    updatedBy: asNullableString(record.updatedBy),
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

export function mapPrismaManifestSummary(value: unknown): HubManifestSummary {
  const record = asRecord(value);
  const versions = Array.isArray(record.versions) ? record.versions.map(asRecord) : [];
  return {
    ...mapPrismaManifest(record),
    versionCount: versions.length,
    publishedVersionCount: versions.filter((version) => version.status === "published").length,
    assetBindingCount: versions.reduce((count, version) => {
      const assets = Array.isArray(version.assets) ? version.assets : [];
      return count + assets.length;
    }, 0),
  };
}

export function mapPrismaManifestVersion(value: unknown): HubManifestVersion {
  const record = asRecord(value);
  const installPolicy = asJsonRecord(record.installPolicy);
  const defaultExecutor = asString(installPolicy.defaultExecutor, "cursor");
  const fallbackExecutors = asStringArray(installPolicy.fallbackExecutors).filter(
    (item) => item === "claude-code" || item === "codex" || item === "cursor",
  );
  return {
    id: asString(record.id),
    manifestId: asString(record.manifestId),
    version: asString(record.version),
    status: toStatus(record.status),
    checksum: asString(record.checksum),
    installPolicy: {
      defaultExecutor: defaultExecutor === "codex" || defaultExecutor === "claude-code" ? defaultExecutor : "cursor",
      fallbackExecutors: fallbackExecutors.length > 0 ? fallbackExecutors : ["claude-code", "codex"],
    },
    compatibility: asJsonRecord(record.compatibility),
    changelog: asNullableString(record.changelog),
    createdBy: asNullableString(record.createdBy),
    publishedBy: asNullableString(record.publishedBy),
    rejectedAt: toNullableIso(record.rejectedAt),
    rejectedReason: asNullableString(record.rejectedReason),
    previousVersionId: asNullableString(record.previousVersionId),
    exportSchemaVersion: asNullableString(record.exportSchemaVersion),
    createdAt: toIso(record.createdAt),
    publishedAt: toNullableIso(record.publishedAt),
  };
}

export function mapPrismaManifestVersionSummary(value: unknown): HubManifestVersionSummary {
  const record = asRecord(value);
  const assets = Array.isArray(record.assets) ? record.assets : [];
  return {
    ...mapPrismaManifestVersion(record),
    assetBindingCount: assets.length,
  };
}

export function mapPrismaManifestAssetBinding(value: unknown): HubManifestAssetBinding {
  const record = asRecord(value);
  const asset = mapPrismaAsset(record.asset);
  const assetVersion = mapPrismaAssetVersion(record.assetVersion);
  return {
    id: asString(record.id),
    manifestVersionId: asString(record.manifestVersionId),
    assetId: asString(record.assetId),
    assetVersionId: asString(record.assetVersionId),
    kind: toAssetKind(record.kind),
    required: asBoolean(record.required, true),
    loadWhen: asStringArray(record.loadWhen),
    order: asNumber(record.order),
    alias: asNullableString(record.alias),
    reason: asNullableString(record.reason),
    stage: asNullableString(record.stage),
    addedBy: asNullableString(record.addedBy),
    addedAt: toNullableIso(record.addedAt),
    policy: asJsonRecord(record.policy),
    assetSlug: asset.slug,
    assetName: asset.name,
    assetVersion: assetVersion.version,
    checksum: assetVersion.checksum,
  };
}

export function mapPrismaAgentProfile(value: unknown): HubAgentProfile {
  const record = asRecord(value);
  const content = asJsonRecord(record.content) as HubAgentProfileContent;
  return {
    id: asString(record.id),
    slug: asString(record.slug),
    name: asString(record.name),
    description: asString(record.description),
    scope: toScope(record.scope),
    status: toStatus(record.status),
    version: asString(record.version, "1.0.0"),
    content,
    checksum: asString(record.checksum),
    ownerOrgId: asNullableString(record.ownerOrgId),
    ownerTeamId: asNullableString(record.ownerTeamId),
    ownerUserId: asNullableString(record.ownerUserId),
    riskLevel: asNullableString(record.riskLevel),
    createdBy: asNullableString(record.createdBy),
    publishedBy: asNullableString(record.publishedBy),
    rejectedAt: toNullableIso(record.rejectedAt),
    rejectedReason: asNullableString(record.rejectedReason),
    deprecatedAt: toNullableIso(record.deprecatedAt),
    archivedAt: toNullableIso(record.archivedAt),
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
    publishedAt: toNullableIso(record.publishedAt),
  };
}

export function mapPrismaAgentProfileSummary(value: unknown): HubAgentProfileSummary {
  const profile = mapPrismaAgentProfile(value);
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
    defaultExecutor: asString(profile.content.defaultExecutor, "cursor"),
    deniedTools: asStringArray(profile.content.deniedTools),
  };
}

export function mapPrismaInstallRecordSummary(value: unknown): HubInstallRecordSummary {
  const record = asRecord(value);
  const manifest = asJsonRecord(record.manifest) as HubInstallRecord["manifest"];
  const client = asJsonRecord(record.client) as HubInstallRecord["client"];
  const packages = Array.isArray(record.packages) ? record.packages : [];
  return {
    id: asString(record.id),
    projectId: asString(record.projectId),
    workspaceId: asNullableString(record.workspaceId),
    manifestSlug: asString(record.manifestSlug, manifest.slug),
    manifestVersion: asString(record.manifestVersion, manifest.version),
    manifestChecksum: asString(record.manifestChecksum) || undefined,
    status: asString(record.status, "accepted"),
    failureReason: asString(record.failureReason) || undefined,
    packageCount: record.packageCount === null || record.packageCount === undefined ? packages.length : asNumber(record.packageCount),
    clientName: asString(record.clientName, client.name),
    clientVersion: asString(record.clientVersion, client.version),
    installedAt: toIso(record.installedAt),
    createdAt: toIso(record.createdAt),
  };
}

export function mapPrismaRuntimeFeedbackSummary(value: unknown): HubRuntimeFeedbackSummary {
  const record = asRecord(value);
  const manifest = asJsonRecord(record.manifest) as HubRuntimeFeedback["manifest"];
  const result = asJsonRecord(record.result) as HubRuntimeFeedback["result"];
  return {
    id: asString(record.id),
    projectId: asString(record.projectId),
    runId: asString(record.runId),
    manifestSlug: asString(record.manifestSlug, manifest.slug),
    manifestVersion: asString(record.manifestVersion, manifest.version),
    success: record.success === null || record.success === undefined ? Boolean(result.success) : asBoolean(record.success),
    durationMs: record.durationMs === null || record.durationMs === undefined ? asNumber(result.durationMs) : asNumber(record.durationMs),
    executorType: asString(record.executorType, asString(record.executor)),
    failureCategory: asString(record.failureCategory) || undefined,
    assetSlugs: asJsonArray(record.assetSlugs),
    privacyChecked: record.privacyChecked === null || record.privacyChecked === undefined ? true : asBoolean(record.privacyChecked),
    createdAt: toIso(record.createdAt),
  };
}

export function mapPrismaAuditLog(value: unknown): HubAuditLog {
  const record = asRecord(value);
  const operatorId = asNullableString(record.operatorId) ?? undefined;
  const operatorName = asNullableString(record.operatorName) ?? undefined;
  return {
    id: asString(record.id),
    targetType: asString(record.targetType),
    targetId: asString(record.targetId),
    targetSlug: asString(record.targetSlug) || undefined,
    targetVersion: asString(record.targetVersion) || undefined,
    action: asString(record.action),
    statusFrom: asString(record.statusFrom) || undefined,
    statusTo: asString(record.statusTo) || undefined,
    operatorId,
    operatorName,
    operatorType: asString(record.operatorType) || undefined,
    operator: operatorName ?? operatorId ?? "system",
    reason: asString(record.reason) || undefined,
    note: asString(record.note) || undefined,
    metadata: asJsonRecord(record.metadata),
    requestId: asString(record.requestId) || undefined,
    createdAt: toIso(record.createdAt),
  };
}
