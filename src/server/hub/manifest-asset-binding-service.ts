import { safeJsonHash } from "./checksum";
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
import type { HubManifestAssetBinding, HubManifestVersionDetail } from "./repositories/repository-types";
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";

type ManifestAssetBindingServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type MemoryBinding = ReturnType<typeof listVersionBindings>[number];
type RepositoryBinding = HubManifestAssetBinding & { bindingId: string };
type BindResponse = { binding: MemoryBinding | RepositoryBinding | undefined };
type UnbindResponse = { removed: boolean; checksum: string };
type ReorderResponse = { items: Array<MemoryBinding | RepositoryBinding>; checksum: string };

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).manifestAssets));
}

function assertMutableRepositoryManifestVersion(version: HubManifestVersionDetail) {
  if (version.status !== "draft" && version.status !== "reviewing") {
    throw MANIFEST_ERROR.bindingNotAllowed("当前 Manifest 版本状态不允许修改资产绑定");
  }
}

function computeChecksum(version: HubManifestVersionDetail, bindings: HubManifestAssetBinding[]) {
  return safeJsonHash({
    manifestId: version.manifestId,
    version: version.version,
    installPolicy: version.installPolicy,
    compatibility: version.compatibility,
    assets: bindings
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
      })),
  });
}

function toApiBinding(binding: HubManifestAssetBinding): RepositoryBinding {
  return { ...binding, bindingId: binding.id };
}

export class ManifestAssetBindingService {
  private readonly repo?: HubRepository;
  private readonly transactionManager?: TransactionManagerPort;

  constructor(repoOrOptions?: HubRepository | ManifestAssetBindingServiceOptions) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  bind(manifestId: string, versionId: string, input: Record<string, unknown>): BindResponse {
    assertSafeManifestPayload(input);
    if (this.repo) return this.bindMemory(manifestId, versionId, input);
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      assertMutableRepositoryManifestVersion(version);
      const assetId = String(input.assetId ?? "");
      const assetVersionId = String(input.assetVersionId ?? "");
      const asset = await tx.assets.findAssetById(assetId);
      const assetVersion = await tx.assetVersions.findAssetVersionByAssetAndId(assetId, assetVersionId);
      if (!asset || !assetVersion) throw MANIFEST_ERROR.bindingNotAllowed("资产或资产版本不存在，或二者不匹配");
      if (asset.status === "archived" || assetVersion.status === "archived") throw MANIFEST_ERROR.assetArchived();
      if (asset.status !== "published" || assetVersion.status !== "published") throw MANIFEST_ERROR.assetNotPublished();
      if (!assetVersion.immutable || !assetVersion.checksum) throw MANIFEST_ERROR.checksumRequired();
      const requestedKind = input.kind ? String(input.kind) : asset.kind;
      if (requestedKind !== asset.kind) throw MANIFEST_ERROR.bindingNotAllowed("绑定 kind 必须与资产 kind 一致");
      if (await tx.manifestAssetBindings.findBindingByAssetVersion(version.id, assetVersion.id)) {
        throw MANIFEST_ERROR.bindingExists();
      }
      const binding = await tx.manifestAssetBindings.createBinding({
        manifestVersionId: version.id,
        assetId: asset.id,
        assetVersionId: assetVersion.id,
        kind: asset.kind as HubAssetKind,
        required: input.required === undefined ? true : Boolean(input.required),
        loadWhen: parseStringArray(input.loadWhen),
        order: Number(input.order ?? (await tx.manifestAssetBindings.listBindingsForChecksum(version.id)).length + 1),
        alias: input.alias ? String(input.alias) : null,
        reason: input.reason ? String(input.reason) : null,
        stage: input.stage ? String(input.stage) : null,
        addedBy: "system",
        addedAt: new Date().toISOString(),
        policy: normalizeRecord(input.policy),
      });
      const bindings = await tx.manifestAssetBindings.listBindingsForChecksum(version.id);
      const checksum = computeChecksum(version, bindings);
      await tx.manifestVersions.updateManifestVersionChecksum({ manifestId, versionId, checksum });
      await tx.auditLogs.createAuditLog({
        targetType: "manifest-version",
        targetId: versionId,
        targetSlug: manifest.slug,
        targetVersion: version.version,
        action: "bind",
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return { binding: toApiBinding(binding) };
    }) as unknown as BindResponse;
  }

  unbind(manifestId: string, versionId: string, bindingId: string): UnbindResponse {
    if (this.repo) {
      const version = this.assertVersion(manifestId, versionId);
      assertMutableManifestVersion(version);
      const index = this.repo.manifestAssets.findIndex((item) => item.manifestVersionId === version.id && item.id === bindingId);
      if (index < 0) throw MANIFEST_ERROR.bindingNotFound();
      this.repo.manifestAssets.splice(index, 1);
      version.checksum = computeManifestVersionChecksum(this.repo, version);
      return { removed: true, checksum: version.checksum };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      assertMutableRepositoryManifestVersion(version);
      if (!(await tx.manifestAssetBindings.findBindingById(version.id, bindingId))) throw MANIFEST_ERROR.bindingNotFound();
      await tx.manifestAssetBindings.deleteBinding(version.id, bindingId);
      const bindings = await tx.manifestAssetBindings.listBindingsForChecksum(version.id);
      const checksum = computeChecksum(version, bindings);
      await tx.manifestVersions.updateManifestVersionChecksum({ manifestId, versionId, checksum });
      await tx.auditLogs.createAuditLog({
        targetType: "manifest-version",
        targetId: versionId,
        targetSlug: manifest.slug,
        targetVersion: version.version,
        action: "unbind",
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return { removed: true, checksum };
    }) as unknown as UnbindResponse;
  }

  reorder(manifestId: string, versionId: string, input: Record<string, unknown>): ReorderResponse {
    assertSafeManifestPayload(input);
    if (this.repo) return this.reorderMemory(manifestId, versionId, input);
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      const version = await tx.manifestVersions.findManifestVersionByManifestAndId(manifestId, versionId);
      if (!version) throw MANIFEST_ERROR.versionNotFound();
      assertMutableRepositoryManifestVersion(version);
      const items = Array.isArray(input.items) ? input.items : [];
      const normalized: Array<{ bindingId: string; order: number }> = [];
      for (const item of items) {
        if (!item || typeof item !== "object") throw MANIFEST_ERROR.bindingNotAllowed("排序项不合法");
        const record = item as { bindingId?: unknown; order?: unknown };
        const order = Number(record.order);
        const bindingId = String(record.bindingId ?? "");
        if (!Number.isFinite(order)) throw MANIFEST_ERROR.bindingNotAllowed("order 必须是数字");
        if (!(await tx.manifestAssetBindings.findBindingById(version.id, bindingId))) throw MANIFEST_ERROR.bindingNotFound();
        normalized.push({ bindingId, order });
      }
      const bindings = await tx.manifestAssetBindings.reorderBindings(version.id, normalized);
      const checksum = computeChecksum(version, bindings);
      await tx.manifestVersions.updateManifestVersionChecksum({ manifestId, versionId, checksum });
      await tx.auditLogs.createAuditLog({
        targetType: "manifest-version",
        targetId: versionId,
        targetSlug: manifest.slug,
        targetVersion: version.version,
        action: "reorder",
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return { items: bindings.map(toApiBinding), checksum };
    }) as unknown as ReorderResponse;
  }

  private bindMemory(manifestId: string, versionId: string, input: Record<string, unknown>) {
    const version = this.assertVersion(manifestId, versionId);
    assertMutableManifestVersion(version);
    const assetId = String(input.assetId ?? "");
    const assetVersionId = String(input.assetVersionId ?? "");
    const asset = this.repo!.assets.find((item) => item.id === assetId);
    const assetVersion = this.repo!.assetVersions.find((item) => item.id === assetVersionId);
    if (!asset || !assetVersion || assetVersion.assetId !== assetId) throw MANIFEST_ERROR.bindingNotAllowed("资产或资产版本不存在，或二者不匹配");
    if (asset.status === "archived" || assetVersion.status === "archived") throw MANIFEST_ERROR.assetArchived();
    if (asset.status !== "published" || assetVersion.status !== "published") throw MANIFEST_ERROR.assetNotPublished();
    if (!assetVersion.immutable || !assetVersion.checksum) throw MANIFEST_ERROR.checksumRequired();
    const requestedKind = input.kind ? String(input.kind) : asset.kind;
    if (requestedKind !== asset.kind) throw MANIFEST_ERROR.bindingNotAllowed("绑定 kind 必须与资产 kind 一致");
    if (this.repo!.manifestAssets.some((link) => link.manifestVersionId === version.id && link.assetVersionId === assetVersion.id)) {
      throw MANIFEST_ERROR.bindingExists();
    }
    const link = this.repo!.linkManifestAsset({
      manifestVersionId: version.id,
      assetId: asset.id,
      assetVersionId: assetVersion.id,
      kind: asset.kind as HubAssetKind,
      required: input.required === undefined ? true : Boolean(input.required),
      loadWhen: parseStringArray(input.loadWhen),
      order: Number(input.order ?? this.repo!.manifestAssets.filter((item) => item.manifestVersionId === version.id).length + 1),
      alias: input.alias ? String(input.alias) : null,
      reason: input.reason ? String(input.reason) : null,
      stage: input.stage ? String(input.stage) : null,
      addedBy: "system",
      addedAt: new Date().toISOString(),
      policy: normalizeRecord(input.policy),
    });
    version.checksum = computeManifestVersionChecksum(this.repo!, version);
    return { binding: listVersionBindings(this.repo!, version.id).find((item) => item.bindingId === link.id) };
  }

  private reorderMemory(manifestId: string, versionId: string, input: Record<string, unknown>) {
    const version = this.assertVersion(manifestId, versionId);
    assertMutableManifestVersion(version);
    const items = Array.isArray(input.items) ? input.items : [];
    for (const item of items) {
      if (!item || typeof item !== "object") throw MANIFEST_ERROR.bindingNotAllowed("排序项不合法");
      const record = item as { bindingId?: unknown; order?: unknown };
      const order = Number(record.order);
      if (!Number.isFinite(order)) throw MANIFEST_ERROR.bindingNotAllowed("order 必须是数字");
      const link = this.repo!.manifestAssets.find(
        (binding) => binding.manifestVersionId === version.id && binding.id === String(record.bindingId ?? ""),
      );
      if (!link) throw MANIFEST_ERROR.bindingNotFound();
      link.order = order;
    }
    version.checksum = computeManifestVersionChecksum(this.repo!, version);
    return { items: listVersionBindings(this.repo!, version.id), checksum: version.checksum };
  }

  private assertVersion(manifestId: string, versionId: string) {
    const manifest = this.repo!.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
    const version = this.repo!.manifestVersions.find((item) => item.manifestId === manifestId && item.id === versionId);
    if (!version) throw MANIFEST_ERROR.versionNotFound();
    return version;
  }
}
