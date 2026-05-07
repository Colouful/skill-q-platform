import { randomUUID } from "node:crypto";
import type {
  HubAgentProfile,
  HubAgentProfileContent,
  HubAsset,
  HubAssetKind,
  HubAssetVersion,
  HubInstallRecord,
  HubManifest,
  HubManifestAsset,
  HubManifestVersion,
  HubRuntimeFeedback,
  HubScope,
  HubStatus,
} from "./types";
import { safeJsonHash, sha256Text } from "./checksum";
import { HubError } from "./errors";

function nowIso() {
  return new Date().toISOString();
}

export class HubRepository {
  assets: HubAsset[] = [];
  assetVersions: HubAssetVersion[] = [];
  manifests: HubManifest[] = [];
  manifestVersions: HubManifestVersion[] = [];
  manifestAssets: HubManifestAsset[] = [];
  agentProfiles: HubAgentProfile[] = [];
  installRecords: HubInstallRecord[] = [];
  runtimeFeedback: HubRuntimeFeedback[] = [];

  createAsset(input: {
    slug: string;
    name: string;
    kind: HubAssetKind;
    scope?: HubScope;
    status?: HubStatus;
    description?: string;
    tags?: unknown[];
    visibility?: string | null;
    ownerOrgId?: string | null;
    ownerTeamId?: string | null;
    ownerUserId?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
  }) {
    const timestamp = nowIso();
    const asset: HubAsset = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      kind: input.kind,
      scope: input.scope ?? "platform",
      ownerOrgId: input.ownerOrgId ?? null,
      ownerTeamId: input.ownerTeamId ?? null,
      ownerUserId: input.ownerUserId ?? null,
      status: input.status ?? "draft",
      description: input.description ?? "",
      tags: input.tags ?? [],
      visibility: input.visibility ?? null,
      latestVersionId: null,
      parentAssetId: null,
      overrideFields: null,
      metadata: null,
      deprecatedAt: null,
      archivedAt: null,
      createdBy: input.createdBy ?? null,
      updatedBy: input.updatedBy ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.assets.push(asset);
    return asset;
  }

  createAssetVersion(input: {
    assetId: string;
    version: string;
    content: string;
    contentFormat?: HubAssetVersion["contentFormat"];
    status?: HubStatus;
    qualityScore?: number;
    dependencies?: unknown[];
    compatibility?: Record<string, unknown>;
    changelog?: string | null;
    createdBy?: string | null;
    publishedBy?: string | null;
    source?: string | null;
    previousVersionId?: string | null;
  }) {
    const status = input.status ?? "draft";
    const version: HubAssetVersion = {
      id: randomUUID(),
      assetId: input.assetId,
      version: input.version,
      content: input.content,
      contentFormat: input.contentFormat ?? "markdown",
      checksum: sha256Text(input.content),
      status,
      immutable: status === "published",
      qualityScore: input.qualityScore ?? 0,
      dependencies: input.dependencies ?? [],
      compatibility: input.compatibility ?? {},
      changelog: input.changelog ?? null,
      createdBy: input.createdBy ?? null,
      publishedBy: input.publishedBy ?? null,
      rejectedAt: null,
      rejectedReason: null,
      source: input.source ?? null,
      contentSize: input.content.length,
      previousVersionId: input.previousVersionId ?? null,
      createdAt: nowIso(),
      publishedAt: status === "published" ? nowIso() : null,
    };
    this.assetVersions.push(version);
    return version;
  }

  createManifest(input: {
    slug: string;
    name: string;
    scope?: HubScope;
    status?: HubStatus;
    description?: string;
    tags?: unknown[];
    techStacks?: unknown[];
    projectKinds?: unknown[];
    recommendedFor?: unknown[];
    ownerOrgId?: string | null;
    ownerTeamId?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
  }) {
    const timestamp = nowIso();
    const manifest: HubManifest = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      scope: input.scope ?? "platform",
      ownerOrgId: input.ownerOrgId ?? null,
      ownerTeamId: input.ownerTeamId ?? null,
      status: input.status ?? "draft",
      description: input.description ?? "",
      tags: input.tags ?? [],
      techStacks: input.techStacks ?? [],
      projectKinds: input.projectKinds ?? [],
      recommendedFor: input.recommendedFor ?? [],
      latestVersionId: null,
      deprecatedAt: null,
      archivedAt: null,
      createdBy: input.createdBy ?? null,
      updatedBy: input.updatedBy ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.manifests.push(manifest);
    return manifest;
  }

  createManifestVersion(input: {
    manifestId: string;
    version: string;
    status?: HubStatus;
    installPolicy?: HubManifestVersion["installPolicy"];
    compatibility?: Record<string, unknown>;
    changelog?: string | null;
    createdBy?: string | null;
    publishedBy?: string | null;
    previousVersionId?: string | null;
    exportSchemaVersion?: string | null;
  }) {
    const status = input.status ?? "draft";
    const manifestVersion: HubManifestVersion = {
      id: randomUUID(),
      manifestId: input.manifestId,
      version: input.version,
      status,
      checksum: "",
      installPolicy: input.installPolicy ?? {
        defaultExecutor: "cursor",
        fallbackExecutors: ["claude-code", "codex"],
      },
      compatibility: input.compatibility ?? {},
      changelog: input.changelog ?? null,
      createdBy: input.createdBy ?? null,
      publishedBy: input.publishedBy ?? null,
      rejectedAt: null,
      rejectedReason: null,
      previousVersionId: input.previousVersionId ?? null,
      exportSchemaVersion: input.exportSchemaVersion ?? null,
      createdAt: nowIso(),
      publishedAt: status === "published" ? nowIso() : null,
    };
    manifestVersion.checksum = safeJsonHash({
      manifestId: manifestVersion.manifestId,
      version: manifestVersion.version,
      installPolicy: manifestVersion.installPolicy,
      compatibility: manifestVersion.compatibility,
    });
    this.manifestVersions.push(manifestVersion);
    return manifestVersion;
  }

  linkManifestAsset(input: {
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
  }) {
    const asset = this.assets.find((item) => item.id === input.assetId);
    const assetVersion = this.assetVersions.find((item) => item.id === input.assetVersionId);
    if (asset?.status === "archived" || assetVersion?.status === "archived") {
      throw new HubError("ASSET_ARCHIVED", "已归档资产不允许新绑定到 Manifest", "请选择 published 状态的资产版本。", 409);
    }
    if (asset?.status === "deprecated" || assetVersion?.status === "deprecated") {
      throw new HubError("ASSET_DEPRECATED", "已废弃资产不应新绑定到 Manifest", "请选择新的 published 资产版本。", 409);
    }
    const link: HubManifestAsset = {
      id: randomUUID(),
      manifestVersionId: input.manifestVersionId,
      assetId: input.assetId,
      assetVersionId: input.assetVersionId,
      kind: input.kind,
      required: input.required ?? true,
      loadWhen: input.loadWhen ?? [],
      order: input.order ?? 0,
      alias: input.alias ?? null,
      reason: input.reason ?? null,
      stage: input.stage ?? null,
      addedBy: input.addedBy ?? null,
      addedAt: input.addedAt ?? null,
      policy: input.policy ?? null,
    };
    this.manifestAssets.push(link);
    return link;
  }

  createAgentProfile(input: {
    slug: string;
    name: string;
    description?: string;
    content: HubAgentProfileContent;
    version?: string;
    scope?: HubScope;
    status?: HubStatus;
    ownerOrgId?: string | null;
    ownerTeamId?: string | null;
    ownerUserId?: string | null;
    riskLevel?: string | null;
    createdBy?: string | null;
    publishedBy?: string | null;
  }) {
    const status = input.status ?? "published";
    const timestamp = nowIso();
    const profile: HubAgentProfile = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      description: input.description ?? "",
      scope: input.scope ?? "platform",
      status,
      version: input.version ?? "1.0.0",
      content: input.content,
      checksum: safeJsonHash(input.content),
      ownerOrgId: input.ownerOrgId ?? null,
      ownerTeamId: input.ownerTeamId ?? null,
      ownerUserId: input.ownerUserId ?? null,
      riskLevel: input.riskLevel ?? input.content.riskLevel,
      createdBy: input.createdBy ?? null,
      publishedBy: input.publishedBy ?? null,
      rejectedAt: null,
      rejectedReason: null,
      deprecatedAt: null,
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: status === "published" ? timestamp : null,
    };
    this.agentProfiles.push(profile);
    return profile;
  }
}

export function createHubRepository() {
  return new HubRepository();
}
