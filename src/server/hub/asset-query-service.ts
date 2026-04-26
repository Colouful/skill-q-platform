import { ASSET_ERROR } from "./asset-governance-errors";
import { normalizeKind, normalizeStatus, parseStringArray, serializeAsset, serializeVersionSummary } from "./asset-admin-shared";
import type { HubRepository } from "./repository";
import type { HubScope } from "./types";

export class AssetQueryService {
  constructor(private readonly repo: HubRepository) {}

  list(input: URLSearchParams | Record<string, string | undefined>) {
    const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
    const page = Number(get("page") ?? 1);
    const pageSize = Number(get("pageSize") ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw ASSET_ERROR.invalidPagination();
    }

    const keyword = (get("keyword") ?? "").trim().toLowerCase();
    const kind = get("kind");
    const status = get("status");
    const scope = get("scope") as HubScope | undefined;
    const ownerTeamId = get("ownerTeamId");
    const ownerUserId = get("ownerUserId");
    const tag = get("tag");
    if (kind) normalizeKind(kind);
    if (status) normalizeStatus(status);

    const filtered = this.repo.assets.filter((asset) => {
      if (keyword) {
        const text = `${asset.slug} ${asset.name} ${asset.description}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }
      if (kind && asset.kind !== kind) return false;
      if (status && asset.status !== status) return false;
      if (scope && asset.scope !== scope) return false;
      if (ownerTeamId && asset.ownerTeamId !== ownerTeamId) return false;
      if (ownerUserId && asset.ownerUserId !== ownerUserId) return false;
      if (tag && !parseStringArray(asset.tags).includes(tag)) return false;
      return true;
    });
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((asset) => {
      const versions = this.repo.assetVersions.filter((version) => version.assetId === asset.id);
      return {
        ...serializeAsset(asset),
        versionCount: versions.length,
        publishedVersionCount: versions.filter((version) => version.status === "published").length,
      };
    });

    return { items, pagination: { page, pageSize, total } };
  }

  detail(assetId: string) {
    const asset = this.repo.assets.find((item) => item.id === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    const versions = this.repo.assetVersions.filter((item) => item.assetId === asset.id);
    const manifestRefs = this.repo.manifestAssets
      .filter((link) => link.assetId === asset.id)
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
    return {
      asset: serializeAsset(asset),
      versions: versions.map(serializeVersionSummary),
      manifestRefs,
      stats: {
        versionCount: versions.length,
        publishedVersionCount: versions.filter((version) => version.status === "published").length,
        manifestRefCount: manifestRefs.length,
      },
    };
  }
}
