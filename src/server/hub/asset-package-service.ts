import { ASSET_ERROR } from "./asset-governance-errors";
import { assertNoSensitivePayload } from "./privacy-guard";
import type { HubRepository } from "./repository";
import { defaultHubRepository } from "./seed";
import type { HubAsset, HubAssetVersion } from "./types";

type PackageFile = {
  path: string;
  checksum: string;
  contentFormat: string;
};

function toExternalAssetType(kind: string) {
  if (kind === "agent-profile") return "agentProfile";
  if (kind === "prompt-template") return "prompt_template";
  return kind;
}

function buildInstallPath(asset: HubAsset, version: HubAssetVersion) {
  const extension = version.contentFormat === "json" ? "json" : version.contentFormat === "yaml" ? "yaml" : "md";
  return `${asset.kind}s/${asset.slug}.${extension}`;
}

function assertPackageSafe(value: unknown) {
  assertNoSensitivePayload(value);
}

export class AssetPackageService {
  constructor(private readonly repo: HubRepository = defaultHubRepository) {}

  search(input: URLSearchParams | Record<string, string | undefined>) {
    const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
    const keyword = get("keyword")?.trim().toLowerCase();
    const kind = get("assetType") ?? get("kind");
    const status = get("status") === "active" ? "published" : get("status");
    const scope = get("scope");
    const activeOnly = status ? status === "published" : true;
    const items = this.repo.assets
      .filter((asset) => {
        if (activeOnly && asset.status !== "published") return false;
        if (status && asset.status !== status) return false;
        if (kind && toExternalAssetType(asset.kind) !== kind && asset.kind !== kind) return false;
        if (scope && asset.scope !== scope) return false;
        if (keyword && !`${asset.slug} ${asset.name} ${asset.description}`.toLowerCase().includes(keyword)) return false;
        return this.findInstallableVersion(asset) !== null;
      })
      .map((asset) => {
        const version = this.findInstallableVersion(asset)!;
        return {
          assetId: asset.slug,
          id: asset.id,
          assetType: toExternalAssetType(asset.kind),
          name: asset.name,
          version: version.version,
          status: asset.status === "published" ? "active" : asset.status,
          checksum: version.checksum,
          scope: asset.scope,
          owner: asset.ownerTeamId ?? asset.ownerOrgId ?? asset.ownerUserId ?? "platform",
          compatibility: version.compatibility,
          qualityScore: version.qualityScore,
          updatedAt: asset.updatedAt,
        };
      });
    return { items, total: items.length };
  }

  detail(slug: string, versionValue?: string) {
    const { asset, version } = this.findAssetAndVersion(slug, versionValue);
    return {
      asset: {
        id: asset.id,
        assetId: asset.slug,
        assetType: toExternalAssetType(asset.kind),
        name: asset.name,
        status: asset.status === "published" ? "active" : asset.status,
        scope: asset.scope,
        owner: asset.ownerTeamId ?? asset.ownerOrgId ?? asset.ownerUserId ?? "platform",
        description: asset.description,
        metadata: asset.metadata ?? {},
        parentAssetId: asset.parentAssetId ?? undefined,
        overrideFields: asset.overrideFields ?? undefined,
      },
      version: this.versionMetadata(asset, version),
      package: this.packageMetadata(slug, versionValue),
    };
  }

  packageMetadata(slug: string, versionValue?: string) {
    const { asset, version } = this.findAssetAndVersion(slug, versionValue);
    const files: PackageFile[] = [
      {
        path: buildInstallPath(asset, version),
        checksum: version.checksum,
        contentFormat: version.contentFormat,
      },
    ];
    const result = {
      assetId: asset.slug,
      assetType: toExternalAssetType(asset.kind),
      name: asset.name,
      version: version.version,
      source: version.source ?? "skill-q-platform",
      checksum: version.checksum,
      compatibility: version.compatibility ?? {},
      files,
      metadata: {
        owner: asset.ownerTeamId ?? asset.ownerOrgId ?? asset.ownerUserId ?? "platform",
        scope: asset.scope,
        status: asset.status === "published" ? "active" : asset.status,
        changelog: version.changelog ?? "",
      },
      changelog: version.changelog ?? "",
    };
    assertPackageSafe(result);
    return result;
  }

  versions(slug: string) {
    const asset = this.findAsset(slug);
    const items = this.repo.assetVersions
      .filter((version) => version.assetId === asset.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((version) => this.versionMetadata(asset, version));
    return { assetId: asset.slug, items };
  }

  rollbackMetadata(slug: string, versionValue?: string) {
    const asset = this.findAsset(slug);
    const current = this.findInstallableVersion(asset, versionValue);
    if (!current) throw ASSET_ERROR.versionNotFound();
    const candidates = this.repo.assetVersions
      .filter((version) => version.assetId === asset.id && version.status === "published" && version.id !== current.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((version) => ({
        fromVersion: current.version,
        toVersion: version.version,
        checksum: version.checksum,
        changelog: version.changelog ?? "",
        package: this.packageMetadata(asset.slug, version.version),
      }));
    return { assetId: asset.slug, currentVersion: current.version, candidates };
  }

  private versionMetadata(asset: HubAsset, version: HubAssetVersion) {
    return {
      id: version.id,
      assetId: asset.slug,
      version: version.version,
      status: version.status === "published" ? "active" : version.status,
      checksum: version.checksum,
      compatibility: version.compatibility ?? {},
      source: version.source ?? "skill-q-platform",
      changelog: version.changelog ?? "",
      contentFormat: version.contentFormat,
      contentSize: version.contentSize ?? version.content.length,
      publishedAt: version.publishedAt ?? undefined,
    };
  }

  private findAsset(slug: string) {
    const asset = this.repo.assets.find((item) => item.slug === slug || item.id === slug);
    if (!asset) throw ASSET_ERROR.notFound();
    return asset;
  }

  private findInstallableVersion(asset: HubAsset, versionValue?: string) {
    const versions = this.repo.assetVersions
      .filter((version) => version.assetId === asset.id && version.status === "published")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return versionValue ? versions.find((version) => version.version === versionValue) ?? null : versions[0] ?? null;
  }

  private findAssetAndVersion(slug: string, versionValue?: string) {
    const asset = this.findAsset(slug);
    const version = this.findInstallableVersion(asset, versionValue);
    if (!version) throw ASSET_ERROR.versionNotFound();
    return { asset, version };
  }
}
