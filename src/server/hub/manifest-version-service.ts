import { safeJsonHash } from "./checksum";
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
import type { HubManifestVersionDetail, HubManifestVersionSummary, HubManifestAssetBinding } from "./repositories/repository-types";
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";

type ManifestVersionServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type VersionSummary = ReturnType<typeof serializeRepositoryManifestVersionSummary>;
type VersionResponse = { version: VersionSummary };
type VersionListResponse = { items: VersionSummary[] };
type VersionDetailResponse = { version: VersionSummary; assets: Array<HubManifestAssetBinding | ReturnType<typeof listVersionBindings>[number]> };

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).manifestVersions));
}

function serializeRepositoryManifestVersionSummary(version: HubManifestVersionSummary | HubManifestVersionDetail, assetBindingCount = 0) {
  const summary = version as HubManifestVersionSummary;
  return {
    id: version.id,
    manifestId: version.manifestId,
    version: version.version,
    status: version.status,
    checksum: version.checksum,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assetBindingCount: "assetBindingCount" in summary ? summary.assetBindingCount : assetBindingCount,
    exportSchemaVersion: version.exportSchemaVersion ?? undefined,
    changelog: version.changelog ?? undefined,
    previousVersionId: version.previousVersionId ?? undefined,
    rejectedAt: version.rejectedAt ?? undefined,
    rejectedReason: version.rejectedReason ?? undefined,
    createdAt: version.createdAt,
    publishedAt: version.publishedAt ?? undefined,
  };
}

function computeChecksum(version: HubManifestVersionDetail, bindings: HubManifestAssetBinding[]) {
  const assets = bindings
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((binding) => ({
      bindingId: binding.id,
      assetSlug: binding.assetSlug,
      assetVersion: binding.assetVersion,
      assetVersionId: binding.assetVersionId,
      checksum: binding.checksum,
      kind: binding.kind,
      required: binding.required,
      loadWhen: binding.loadWhen,
      order: binding.order,
    }));
  return safeJsonHash({
    manifestId: version.manifestId,
    version: version.version,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assets,
  });
}

export class ManifestVersionService {
  private readonly repo?: HubRepository;
  private readonly transactionManager?: TransactionManagerPort;

  constructor(repoOrOptions?: HubRepository | ManifestVersionServiceOptions) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  list(manifestId: string): VersionListResponse {
    if (this.repo) {
      this.assertManifest(manifestId);
      return {
        items: this.repo.manifestVersions
          .filter((item) => item.manifestId === manifestId)
          .map((version) => serializeManifestVersionSummary(this.repo!, version)),
      };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      const items = await tx.manifests.listManifestVersions(manifestId);
      return { items: items.map((item) => serializeRepositoryManifestVersionSummary(item)) };
    }) as unknown as VersionListResponse;
  }

  create(manifestId: string, input: Record<string, unknown>): VersionResponse {
    assertSafeManifestPayload(input);
    if (this.repo) {
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
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
      const versionValue = String(input.version ?? "").trim();
      if (!versionValue) throw MANIFEST_ERROR.versionCreateInvalid("Manifest version 不能为空");
      if (await tx.manifestVersions.findManifestVersionByManifestAndVersion(manifestId, versionValue)) {
        throw MANIFEST_ERROR.versionExists();
      }
      const installPolicy = normalizeInstallPolicy(input.installPolicy);
      const compatibility = normalizeRecord(input.compatibility);
      const checksum = safeJsonHash({ manifestId, version: versionValue, installPolicy, compatibility, assets: [] });
      const version = await tx.manifestVersions.createManifestVersion({
        manifestId,
        version: versionValue,
        status: "draft",
        checksum,
        installPolicy,
        compatibility,
        changelog: input.changelog ? String(input.changelog) : null,
        createdBy: "system",
        previousVersionId: input.previousVersionId ? String(input.previousVersionId) : null,
        exportSchemaVersion: input.exportSchemaVersion ? String(input.exportSchemaVersion) : null,
      });
      return { version: serializeRepositoryManifestVersionSummary(version, 0) };
    }) as unknown as VersionResponse;
  }

  detail(manifestId: string, versionId: string): VersionDetailResponse {
    if (this.repo) {
      this.assertManifest(manifestId);
      const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      return { version: serializeManifestVersionSummary(this.repo, version), assets: listVersionBindings(this.repo, version.id) };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      const assets = await tx.manifestAssetBindings.listBindingsForChecksum(versionId);
      return { version: serializeRepositoryManifestVersionSummary(version, assets.length), assets };
    }) as unknown as VersionDetailResponse;
  }

  publish(manifestId: string, versionId: string, input: Record<string, unknown> = {}): VersionResponse {
    assertSafeManifestPayload(input);
    if (this.repo) {
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
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      if (version.status !== "draft" && version.status !== "reviewing") throw MANIFEST_ERROR.publishNotAllowed();
      const statusFrom = version.status;
      const bindings = await tx.manifestAssetBindings.listBindingsForChecksum(versionId);
      if (!bindings.some((item) => item.required)) throw MANIFEST_ERROR.requiredAssetMissing();
      for (const binding of bindings) {
        const asset = await tx.assets.findAssetById(binding.assetId);
        const assetVersion = await tx.assetVersions.findAssetVersionByAssetAndId(binding.assetId, binding.assetVersionId);
        if (!asset || !assetVersion || asset.status !== "published" || assetVersion.status !== "published") {
          throw MANIFEST_ERROR.assetNotPublished();
        }
        if (!assetVersion.immutable || !assetVersion.checksum) throw MANIFEST_ERROR.checksumRequired();
      }
      const checksum = computeChecksum(version, bindings);
      if (!checksum) throw MANIFEST_ERROR.checksumRequired();
      const published = await tx.manifestVersions.publishManifestVersion({
        manifestId,
        versionId,
        checksum,
        publishedAt: new Date().toISOString(),
        publishedBy: "system",
      });
      await tx.manifests.markManifestPublished({ manifestId, latestVersionId: versionId, updatedBy: "system" });
      await tx.auditLogs.createAuditLog({
        targetType: "manifest-version",
        targetId: versionId,
        targetSlug: manifest.slug,
        targetVersion: version.version,
        action: "publish",
        statusFrom,
        statusTo: "published",
        note: input.publishNote ? String(input.publishNote) : undefined,
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return { version: serializeRepositoryManifestVersionSummary(published, bindings.length) };
    }) as unknown as VersionResponse;
  }

  deprecate(manifestId: string, versionId: string, input: Record<string, unknown>): VersionResponse {
    assertSafeManifestPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw MANIFEST_ERROR.versionCreateInvalid("废弃原因不能为空");
    if (this.repo) {
      this.assertManifest(manifestId);
      const version = this.repo.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      if (version.status !== "published") throw MANIFEST_ERROR.deprecateNotAllowed();
      version.status = "deprecated";
      return { version: serializeManifestVersionSummary(this.repo, version) };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      if (version.status !== "published") throw MANIFEST_ERROR.deprecateNotAllowed();
      const deprecated = await tx.manifestVersions.deprecateManifestVersion({ manifestId, versionId });
      const bindings = await tx.manifestAssetBindings.listBindingsForChecksum(versionId);
      return { version: serializeRepositoryManifestVersionSummary(deprecated, bindings.length) };
    }) as unknown as VersionResponse;
  }

  private assertManifest(manifestId: string) {
    const manifest = this.repo?.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    return manifest;
  }
}
