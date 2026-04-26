import { assertNoSensitivePayload } from "./privacy-guard";
import { safeJsonHash } from "./checksum";
import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  HUB_SCOPES,
  HUB_STATUSES,
  type HubAsset,
  type HubAssetVersion,
  type HubManifest,
  type HubManifestAsset,
  type HubManifestVersion,
  type HubScope,
  type HubStatus,
} from "./types";
import type { HubRepository } from "./repository";

export function assertSafeManifestPayload(input: unknown) {
  assertNoSensitivePayload(input);
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

export function normalizeScope(value: unknown): HubScope {
  const scope = String(value ?? "");
  if (!HUB_SCOPES.includes(scope as HubScope)) throw MANIFEST_ERROR.createInvalid("Manifest scope 不合法");
  return scope as HubScope;
}

export function normalizeStatus(value: string): HubStatus {
  if (!HUB_STATUSES.includes(value as HubStatus)) throw MANIFEST_ERROR.invalidStatus();
  return value as HubStatus;
}

export function normalizeInstallPolicy(value: unknown): HubManifestVersion["installPolicy"] {
  const record = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const defaultExecutor = String(record.defaultExecutor ?? "cursor");
  const fallbackExecutors = Array.isArray(record.fallbackExecutors)
    ? record.fallbackExecutors.map(String).filter((item) => item === "claude-code" || item === "codex" || item === "cursor")
    : ["claude-code", "codex"];
  if (defaultExecutor !== "cursor" && defaultExecutor !== "codex" && defaultExecutor !== "claude-code") {
    throw MANIFEST_ERROR.versionCreateInvalid("Manifest installPolicy.defaultExecutor 不合法");
  }
  return {
    defaultExecutor,
    fallbackExecutors: fallbackExecutors.length > 0 ? fallbackExecutors : ["claude-code", "codex"],
  } as HubManifestVersion["installPolicy"];
}

export function normalizeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function serializeManifest(manifest: HubManifest) {
  return {
    id: manifest.id,
    slug: manifest.slug,
    name: manifest.name,
    scope: manifest.scope,
    status: manifest.status,
    description: manifest.description,
    tags: parseStringArray(manifest.tags),
    techStacks: parseStringArray(manifest.techStacks),
    projectKinds: parseStringArray(manifest.projectKinds),
    recommendedFor: parseStringArray(manifest.recommendedFor),
    latestVersionId: manifest.latestVersionId ?? undefined,
    deprecatedAt: manifest.deprecatedAt ?? undefined,
    archivedAt: manifest.archivedAt ?? undefined,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
  };
}

export function serializeManifestVersionSummary(repo: HubRepository, version: HubManifestVersion) {
  return {
    id: version.id,
    manifestId: version.manifestId,
    version: version.version,
    status: version.status,
    checksum: version.checksum,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assetBindingCount: repo.manifestAssets.filter((item) => item.manifestVersionId === version.id).length,
    exportSchemaVersion: version.exportSchemaVersion ?? undefined,
    changelog: version.changelog ?? undefined,
    previousVersionId: version.previousVersionId ?? undefined,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt ?? undefined,
  };
}

export function serializeBinding(
  link: HubManifestAsset,
  asset: HubAsset,
  assetVersion: HubAssetVersion,
) {
  return {
    bindingId: link.id,
    assetId: asset.id,
    assetSlug: asset.slug,
    assetName: asset.name,
    assetVersionId: assetVersion.id,
    assetVersion: assetVersion.version,
    kind: link.kind,
    checksum: assetVersion.checksum,
    required: link.required,
    loadWhen: link.loadWhen,
    order: link.order,
    alias: link.alias ?? undefined,
    reason: link.reason ?? undefined,
    stage: link.stage ?? undefined,
    policy: link.policy ?? undefined,
  };
}

export function listVersionBindings(repo: HubRepository, versionId: string) {
  return repo.manifestAssets
    .filter((item) => item.manifestVersionId === versionId)
    .sort((a, b) => a.order - b.order)
    .map((link) => {
      const asset = repo.assets.find((item) => item.id === link.assetId);
      const assetVersion = repo.assetVersions.find((item) => item.id === link.assetVersionId);
      if (!asset || !assetVersion) return null;
      return serializeBinding(link, asset, assetVersion);
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function computeManifestVersionChecksum(repo: HubRepository, version: HubManifestVersion) {
  const bindings = repo.manifestAssets
    .filter((item) => item.manifestVersionId === version.id)
    .sort((a, b) => a.order - b.order)
    .map((link) => {
      const asset = repo.assets.find((item) => item.id === link.assetId);
      const assetVersion = repo.assetVersions.find((item) => item.id === link.assetVersionId);
      return {
        bindingId: link.id,
        assetSlug: asset?.slug ?? "",
        assetVersion: assetVersion?.version ?? "",
        assetVersionId: link.assetVersionId,
        checksum: assetVersion?.checksum ?? "",
        kind: link.kind,
        required: link.required,
        loadWhen: link.loadWhen,
        order: link.order,
      };
    });
  return safeJsonHash({
    manifestId: version.manifestId,
    version: version.version,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assets: bindings,
  });
}

export function assertMutableManifestVersion(version: HubManifestVersion) {
  if (version.status !== "draft" && version.status !== "reviewing") {
    throw MANIFEST_ERROR.bindingNotAllowed("当前 Manifest 版本状态不允许修改资产绑定");
  }
}
