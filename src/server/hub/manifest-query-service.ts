import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  normalizeStatus,
  serializeManifest,
} from "./manifest-admin-shared";
import type { HubRepository } from "./repository";
import { getHubRepositoryProvider } from "./repositories/hub-repository-provider";
import { InMemoryHubRepositoryAdapter } from "./repositories/memory/in-memory-hub-repository-adapter";
import type { ManifestRepositoryPort } from "./repositories/ports/manifest-repository-port";
import type {
  HubManifestAssetBinding,
  HubManifestSummary,
  HubManifestVersionSummary,
  ManifestListQuery,
} from "./repositories/repository-types";
import type { HubScope } from "./types";

function isHubRepository(repo: unknown): repo is HubRepository {
  return Boolean(repo && typeof repo === "object" && Array.isArray((repo as HubRepository).manifests));
}

function toRepository(repo?: HubRepository | ManifestRepositoryPort): ManifestRepositoryPort {
  if (!repo) return getHubRepositoryProvider();
  if (isHubRepository(repo)) return new InMemoryHubRepositoryAdapter(repo);
  return repo as ManifestRepositoryPort;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function readQuery(input: URLSearchParams | Record<string, string | undefined>): ManifestListQuery {
  const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
  const page = Number(get("page") ?? 1);
  const pageSize = Number(get("pageSize") ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw MANIFEST_ERROR.invalidPagination();
  }
  const status = get("status") || undefined;
  if (status) normalizeStatus(status);
  return {
    keyword: get("keyword")?.trim() || undefined,
    status,
    scope: (get("scope") as HubScope | undefined) || undefined,
    ownerTeamId: get("ownerTeamId") || undefined,
    techStack: get("techStack") || undefined,
    projectKind: get("projectKind") || undefined,
    tag: get("tag") || undefined,
    page,
    pageSize,
  };
}

function serializeVersionSummary(version: HubManifestVersionSummary) {
  return {
    id: version.id,
    manifestId: version.manifestId,
    version: version.version,
    status: version.status,
    checksum: version.checksum,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assetBindingCount: version.assetBindingCount,
    exportSchemaVersion: version.exportSchemaVersion ?? undefined,
    changelog: version.changelog ?? undefined,
    previousVersionId: version.previousVersionId ?? undefined,
    rejectedAt: version.rejectedAt ?? undefined,
    rejectedReason: version.rejectedReason ?? undefined,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt ?? undefined,
  };
}

function serializeBinding(binding: HubManifestAssetBinding) {
  return {
    bindingId: binding.id,
    manifestVersionId: binding.manifestVersionId,
    assetId: binding.assetId,
    assetSlug: binding.assetSlug,
    assetName: binding.assetName,
    assetVersionId: binding.assetVersionId,
    assetVersion: binding.assetVersion,
    kind: binding.kind,
    checksum: binding.checksum,
    required: binding.required,
    loadWhen: binding.loadWhen,
    order: binding.order,
    alias: binding.alias ?? undefined,
    reason: binding.reason ?? undefined,
    stage: binding.stage ?? undefined,
    policy: binding.policy ?? undefined,
  };
}

function serializeManifestSummary(manifest: HubManifestSummary) {
  return {
    id: manifest.id,
    slug: manifest.slug,
    name: manifest.name,
    scope: manifest.scope,
    status: manifest.status,
    description: manifest.description,
    tags: toStringArray(manifest.tags),
    techStacks: toStringArray(manifest.techStacks),
    projectKinds: toStringArray(manifest.projectKinds),
    recommendedFor: toStringArray(manifest.recommendedFor),
    latestVersionId: manifest.latestVersionId ?? undefined,
    deprecatedAt: manifest.deprecatedAt ?? undefined,
    archivedAt: manifest.archivedAt ?? undefined,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    versionCount: manifest.versionCount,
    publishedVersionCount: manifest.publishedVersionCount,
    assetBindingCount: manifest.assetBindingCount,
  };
}

export class ManifestQueryService {
  private readonly repository: ManifestRepositoryPort;

  constructor(repo?: HubRepository | ManifestRepositoryPort) {
    this.repository = toRepository(repo);
  }

  async list(input: URLSearchParams | Record<string, string | undefined>) {
    const result = await this.repository.listManifests(readQuery(input));
    return {
      ...result,
      items: result.items.map(serializeManifestSummary),
    };
  }

  async detail(manifestId: string) {
    const manifest = await this.repository.findManifestById(manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    const versions = await this.repository.listManifestVersions(manifest.id);
    const bindingGroups = await Promise.all(versions.map((version) => this.repository.listManifestAssetBindings(version.id)));
    const assetBindings = bindingGroups.flat().map(serializeBinding);
    return {
      manifest: serializeManifest(manifest),
      versions: versions.map(serializeVersionSummary),
      assetBindings,
      stats: {
        versionCount: versions.length,
        publishedVersionCount: versions.filter((version) => version.status === "published").length,
        assetBindingCount: assetBindings.length,
      },
    };
  }

  async listManifestVersions(manifestId: string) {
    const manifest = await this.repository.findManifestById(manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    const versions = await this.repository.listManifestVersions(manifest.id);
    return versions.map(serializeVersionSummary);
  }

  async findManifestVersionById(versionId: string) {
    const version = await this.repository.findManifestVersionById(versionId);
    if (!version) throw MANIFEST_ERROR.versionNotFound();
    const assets = await this.repository.listManifestAssetBindings(version.id);
    return {
      version: serializeVersionSummary({
        ...version,
        assetBindingCount: assets.length,
      }),
      assets: assets.map(serializeBinding),
    };
  }
}
