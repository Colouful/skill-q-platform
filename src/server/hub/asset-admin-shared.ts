import { assertNoSensitivePayload } from "./privacy-guard";
import { ASSET_ERROR } from "./asset-governance-errors";
import {
  HUB_SCOPES,
  HUB_STATUSES,
  type HubAsset,
  type HubAssetKind,
  type HubAssetVersion,
  type HubScope,
  type HubStatus,
} from "./types";

export const HUB_CONTENT_FORMATS = ["markdown", "json", "yaml"] as const;
export const ADMIN_ASSET_KINDS = [
  "rule",
  "skill",
  "role",
  "flow",
  "scenario",
  "agent-profile",
  "tech-profile",
  "source-pack",
  "contract",
] as const;

export type HubContentFormat = (typeof HUB_CONTENT_FORMATS)[number];

export function assertSafeAdminPayload(input: unknown) {
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

export function normalizeKind(value: unknown): HubAssetKind {
  const kind = String(value ?? "");
  if (!ADMIN_ASSET_KINDS.includes(kind as (typeof ADMIN_ASSET_KINDS)[number])) throw ASSET_ERROR.invalidKind();
  return kind as HubAssetKind;
}

export function normalizeScope(value: unknown): HubScope {
  const scope = String(value ?? "");
  if (!HUB_SCOPES.includes(scope as HubScope)) throw ASSET_ERROR.createInvalid("资产 scope 不合法");
  return scope as HubScope;
}

export function normalizeStatus(value: string): HubStatus {
  if (!HUB_STATUSES.includes(value as HubStatus)) throw ASSET_ERROR.invalidStatus();
  return value as HubStatus;
}

export function normalizeContentFormat(value: unknown): HubContentFormat {
  const format = String(value ?? "markdown");
  if (!HUB_CONTENT_FORMATS.includes(format as HubContentFormat)) {
    throw ASSET_ERROR.versionCreateInvalid("资产版本 contentFormat 不合法");
  }
  return format as HubContentFormat;
}

export function serializeAsset(asset: HubAsset) {
  return {
    id: asset.id,
    slug: asset.slug,
    name: asset.name,
    kind: asset.kind,
    scope: asset.scope,
    status: asset.status,
    visibility: asset.visibility ?? undefined,
    tags: parseStringArray(asset.tags),
    description: asset.description,
    latestVersionId: asset.latestVersionId ?? undefined,
    deprecatedAt: asset.deprecatedAt ?? undefined,
    archivedAt: asset.archivedAt ?? undefined,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

export function serializeVersionSummary(version: HubAssetVersion) {
  return {
    id: version.id,
    assetId: version.assetId,
    version: version.version,
    status: version.status,
    immutable: version.immutable,
    checksum: version.checksum,
    contentFormat: version.contentFormat,
    contentSize: version.contentSize ?? version.content.length,
    qualityScore: version.qualityScore,
    changelog: version.changelog ?? undefined,
    source: version.source ?? undefined,
    previousVersionId: version.previousVersionId ?? undefined,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt ?? undefined,
  };
}

export function serializeVersionDetail(version: HubAssetVersion) {
  return {
    ...serializeVersionSummary(version),
    content: version.content,
    dependencies: version.dependencies,
    compatibility: version.compatibility,
  };
}
