import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  listVersionBindings,
  normalizeStatus,
  parseStringArray,
  serializeManifest,
  serializeManifestVersionSummary,
} from "./manifest-admin-shared";
import type { HubRepository } from "./repository";
import type { HubScope } from "./types";

export class ManifestQueryService {
  constructor(private readonly repo: HubRepository) {}

  list(input: URLSearchParams | Record<string, string | undefined>) {
    const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
    const page = Number(get("page") ?? 1);
    const pageSize = Number(get("pageSize") ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw MANIFEST_ERROR.invalidPagination();
    }
    const keyword = (get("keyword") ?? "").trim().toLowerCase();
    const status = get("status");
    const scope = get("scope") as HubScope | undefined;
    const ownerTeamId = get("ownerTeamId");
    const techStack = get("techStack");
    const projectKind = get("projectKind");
    const tag = get("tag");
    if (status) normalizeStatus(status);

    const filtered = this.repo.manifests.filter((manifest) => {
      if (keyword && !`${manifest.slug} ${manifest.name} ${manifest.description}`.toLowerCase().includes(keyword)) return false;
      if (status && manifest.status !== status) return false;
      if (scope && manifest.scope !== scope) return false;
      if (ownerTeamId && manifest.ownerTeamId !== ownerTeamId) return false;
      if (techStack && !parseStringArray(manifest.techStacks).includes(techStack)) return false;
      if (projectKind && !parseStringArray(manifest.projectKinds).includes(projectKind)) return false;
      if (tag && !parseStringArray(manifest.tags).includes(tag)) return false;
      return true;
    });
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((manifest) => {
      const versions = this.repo.manifestVersions.filter((version) => version.manifestId === manifest.id);
      const versionIds = new Set(versions.map((version) => version.id));
      return {
        ...serializeManifest(manifest),
        versionCount: versions.length,
        publishedVersionCount: versions.filter((version) => version.status === "published").length,
        assetBindingCount: this.repo.manifestAssets.filter((link) => versionIds.has(link.manifestVersionId)).length,
      };
    });
    return { items, pagination: { page, pageSize, total } };
  }

  detail(manifestId: string) {
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    const versions = this.repo.manifestVersions.filter((item) => item.manifestId === manifest.id);
    const versionIds = new Set(versions.map((version) => version.id));
    const assetBindings = versions.flatMap((version) => listVersionBindings(this.repo, version.id));
    return {
      manifest: serializeManifest(manifest),
      versions: versions.map((version) => serializeManifestVersionSummary(this.repo, version)),
      assetBindings,
      stats: {
        versionCount: versions.length,
        publishedVersionCount: versions.filter((version) => version.status === "published").length,
        assetBindingCount: this.repo.manifestAssets.filter((link) => versionIds.has(link.manifestVersionId)).length,
      },
    };
  }
}
