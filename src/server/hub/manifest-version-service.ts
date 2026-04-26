import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  assertSafeManifestPayload,
  computeManifestVersionChecksum,
  listVersionBindings,
  normalizeInstallPolicy,
  normalizeRecord,
  serializeManifestVersionSummary,
} from "./manifest-admin-shared";
import type { HubRepository } from "./repository";

export class ManifestVersionService {
  constructor(private readonly repo: HubRepository) {}

  list(manifestId: string) {
    this.assertManifest(manifestId);
    const items = this.repo.manifestVersions
      .filter((item) => item.manifestId === manifestId)
      .map((version) => serializeManifestVersionSummary(this.repo, version));
    return { items };
  }

  create(manifestId: string, input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    const manifest = this.assertManifest(manifestId);
    if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
    const versionValue = String(input.version ?? "").trim();
    if (!versionValue) throw MANIFEST_ERROR.versionCreateInvalid("Manifest version 不能为空");
    if (this.repo.manifestVersions.some((version) => version.manifestId === manifestId && version.version === versionValue)) {
      throw MANIFEST_ERROR.versionExists();
    }
    const version = this.repo.createManifestVersion({
      manifestId,
      version: versionValue,
      status: "draft",
      installPolicy: normalizeInstallPolicy(input.installPolicy),
      compatibility: normalizeRecord(input.compatibility),
      changelog: input.changelog ? String(input.changelog) : null,
      createdBy: "system",
      previousVersionId: input.previousVersionId ? String(input.previousVersionId) : null,
      exportSchemaVersion: input.exportSchemaVersion ? String(input.exportSchemaVersion) : null,
    });
    version.checksum = computeManifestVersionChecksum(this.repo, version);
    return { version: serializeManifestVersionSummary(this.repo, version) };
  }

  detail(manifestId: string, versionId: string) {
    this.assertManifest(manifestId);
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!version) throw MANIFEST_ERROR.versionNotFound();
    return {
      version: serializeManifestVersionSummary(this.repo, version),
      assets: listVersionBindings(this.repo, version.id),
    };
  }

  publish(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
    assertSafeManifestPayload(input);
    const manifest = this.assertManifest(manifestId);
    if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!version) throw MANIFEST_ERROR.versionNotFound();
    if (version.status !== "draft" && version.status !== "reviewing") throw MANIFEST_ERROR.publishNotAllowed();
    const links = this.repo.manifestAssets.filter((item) => item.manifestVersionId === version.id);
    if (!links.some((item) => item.required)) throw MANIFEST_ERROR.requiredAssetMissing();
    for (const link of links) {
      const asset = this.repo.assets.find((item) => item.id === link.assetId);
      const assetVersion = this.repo.assetVersions.find((item) => item.id === link.assetVersionId);
      if (!asset || !assetVersion || asset.status !== "published" || assetVersion.status !== "published") {
        throw MANIFEST_ERROR.assetNotPublished();
      }
      if (!assetVersion.immutable || !assetVersion.checksum) throw MANIFEST_ERROR.checksumRequired();
    }
    version.checksum = computeManifestVersionChecksum(this.repo, version);
    if (!version.checksum) throw MANIFEST_ERROR.checksumRequired();
    version.status = "published";
    version.publishedAt = new Date().toISOString();
    version.publishedBy = "system";
    manifest.status = "published";
    manifest.latestVersionId = version.id;
    manifest.updatedBy = "system";
    manifest.updatedAt = new Date().toISOString();
    return { version: serializeManifestVersionSummary(this.repo, version) };
  }

  deprecate(manifestId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw MANIFEST_ERROR.versionCreateInvalid("废弃原因不能为空");
    this.assertManifest(manifestId);
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!version) throw MANIFEST_ERROR.versionNotFound();
    if (version.status !== "published") throw MANIFEST_ERROR.deprecateNotAllowed();
    version.status = "deprecated";
    return { version: serializeManifestVersionSummary(this.repo, version) };
  }

  private assertManifest(manifestId: string) {
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    return manifest;
  }
}
