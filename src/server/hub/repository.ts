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
    ownerOrgId?: string | null;
    ownerTeamId?: string | null;
    ownerUserId?: string | null;
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
    status?: HubStatus;
    qualityScore?: number;
    dependencies?: unknown[];
    compatibility?: Record<string, unknown>;
  }) {
    const status = input.status ?? "draft";
    const version: HubAssetVersion = {
      id: randomUUID(),
      assetId: input.assetId,
      version: input.version,
      content: input.content,
      contentFormat: "markdown",
      checksum: sha256Text(input.content),
      status,
      immutable: status === "published",
      qualityScore: input.qualityScore ?? 0,
      dependencies: input.dependencies ?? [],
      compatibility: input.compatibility ?? {},
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
    ownerOrgId?: string | null;
    ownerTeamId?: string | null;
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
  }) {
    const link: HubManifestAsset = {
      id: randomUUID(),
      manifestVersionId: input.manifestVersionId,
      assetId: input.assetId,
      assetVersionId: input.assetVersionId,
      kind: input.kind,
      required: input.required ?? true,
      loadWhen: input.loadWhen ?? [],
      order: input.order ?? 0,
    };
    this.manifestAssets.push(link);
    return link;
  }

  createAgentProfile(input: {
    slug: string;
    name: string;
    content: HubAgentProfileContent;
    version?: string;
    scope?: HubScope;
    status?: HubStatus;
  }) {
    const status = input.status ?? "published";
    const timestamp = nowIso();
    const profile: HubAgentProfile = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      scope: input.scope ?? "platform",
      status,
      version: input.version ?? "1.0.0",
      content: input.content,
      checksum: safeJsonHash(input.content),
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
