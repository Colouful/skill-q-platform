import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  assertMutableManifestVersion,
  assertSafeManifestPayload,
  computeManifestVersionChecksum,
  listVersionBindings,
  normalizeRecord,
  parseStringArray,
} from "./manifest-admin-shared";
import type { HubRepository } from "./repository";
import type { HubAssetKind } from "./types";

export class ManifestAssetBindingService {
  constructor(private readonly repo: HubRepository) {}

  bind(manifestId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    const version = this.assertVersion(manifestId, versionId);
    assertMutableManifestVersion(version);
    const assetId = String(input.assetId ?? "");
    const assetVersionId = String(input.assetVersionId ?? "");
    const asset = this.repo.assets.find((item) => item.id === assetId);
    const assetVersion = this.repo.assetVersions.find((item) => item.id === assetVersionId);
    if (!asset || !assetVersion || assetVersion.assetId !== assetId) throw MANIFEST_ERROR.bindingNotAllowed("资产或资产版本不存在，或二者不匹配");
    if (asset.status === "archived" || assetVersion.status === "archived") throw MANIFEST_ERROR.assetArchived();
    if (asset.status !== "published" || assetVersion.status !== "published") throw MANIFEST_ERROR.assetNotPublished();
    if (!assetVersion.immutable || !assetVersion.checksum) throw MANIFEST_ERROR.checksumRequired();
    const requestedKind = input.kind ? String(input.kind) : asset.kind;
    if (requestedKind !== asset.kind) throw MANIFEST_ERROR.bindingNotAllowed("绑定 kind 必须与资产 kind 一致");
    if (this.repo.manifestAssets.some((link) => link.manifestVersionId === version.id && link.assetVersionId === assetVersion.id)) {
      throw MANIFEST_ERROR.bindingExists();
    }
    const link = this.repo.linkManifestAsset({
      manifestVersionId: version.id,
      assetId: asset.id,
      assetVersionId: assetVersion.id,
      kind: asset.kind as HubAssetKind,
      required: input.required === undefined ? true : Boolean(input.required),
      loadWhen: parseStringArray(input.loadWhen),
      order: Number(input.order ?? this.repo.manifestAssets.filter((item) => item.manifestVersionId === version.id).length + 1),
      alias: input.alias ? String(input.alias) : null,
      reason: input.reason ? String(input.reason) : null,
      stage: input.stage ? String(input.stage) : null,
      addedBy: "system",
      addedAt: new Date().toISOString(),
      policy: normalizeRecord(input.policy),
    });
    version.checksum = computeManifestVersionChecksum(this.repo, version);
    return { binding: listVersionBindings(this.repo, version.id).find((item) => item.bindingId === link.id) };
  }

  unbind(manifestId: string, versionId: string, bindingId: string) {
    const version = this.assertVersion(manifestId, versionId);
    assertMutableManifestVersion(version);
    const index = this.repo.manifestAssets.findIndex((item) => item.manifestVersionId === version.id && item.id === bindingId);
    if (index < 0) throw MANIFEST_ERROR.bindingNotFound();
    this.repo.manifestAssets.splice(index, 1);
    version.checksum = computeManifestVersionChecksum(this.repo, version);
    return { removed: true, checksum: version.checksum };
  }

  reorder(manifestId: string, versionId: string, input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    const version = this.assertVersion(manifestId, versionId);
    assertMutableManifestVersion(version);
    const items = Array.isArray(input.items) ? input.items : [];
    for (const item of items) {
      if (!item || typeof item !== "object") throw MANIFEST_ERROR.bindingNotAllowed("排序项不合法");
      const record = item as { bindingId?: unknown; order?: unknown };
      const order = Number(record.order);
      if (!Number.isFinite(order)) throw MANIFEST_ERROR.bindingNotAllowed("order 必须是数字");
      const link = this.repo.manifestAssets.find(
        (binding) => binding.manifestVersionId === version.id && binding.id === String(record.bindingId ?? ""),
      );
      if (!link) throw MANIFEST_ERROR.bindingNotFound();
      link.order = order;
    }
    version.checksum = computeManifestVersionChecksum(this.repo, version);
    return { items: listVersionBindings(this.repo, version.id), checksum: version.checksum };
  }

  private assertVersion(manifestId: string, versionId: string) {
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
    const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!version) throw MANIFEST_ERROR.versionNotFound();
    return version;
  }
}
