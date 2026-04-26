import { ASSET_ERROR } from "./asset-governance-errors";
import { assertSafeAdminPayload, normalizeKind, normalizeScope, optionalString, parseStringArray, serializeAsset } from "./asset-admin-shared";
import type { HubRepository } from "./repository";
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";

type AssetGovernanceServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type AssetResponse = { asset: ReturnType<typeof serializeAsset> };

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).assets));
}

export class AssetGovernanceService {
  private readonly repo?: HubRepository;
  private readonly transactionManager?: TransactionManagerPort;

  constructor(repoOrOptions?: HubRepository | AssetGovernanceServiceOptions) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  createDraft(input: Record<string, unknown>): AssetResponse {
    assertSafeAdminPayload(input);
    const slug = String(input.slug ?? "").trim();
    const name = String(input.name ?? "").trim();
    if (!slug || !name || !input.kind || !input.scope) throw ASSET_ERROR.createInvalid();
    if (this.repo) {
      if (this.repo.assets.some((asset) => asset.slug === slug)) throw ASSET_ERROR.slugExists();
      const asset = this.repo.createAsset({
        slug,
        name,
        kind: normalizeKind(input.kind),
        scope: normalizeScope(input.scope),
        status: "draft",
        description: String(input.description ?? ""),
        tags: parseStringArray(input.tags),
        visibility: optionalString(input.visibility),
        ownerOrgId: optionalString(input.ownerOrgId),
        ownerTeamId: optionalString(input.ownerTeamId),
        ownerUserId: optionalString(input.ownerUserId),
        createdBy: "system",
        updatedBy: "system",
      });
      return { asset: serializeAsset(asset) };
    }

    return this.transactionManager!.runInTransaction(async (tx) => {
      if (await tx.assets.findAssetBySlug(slug)) throw ASSET_ERROR.slugExists();
      const asset = await tx.assets.createAsset({
        slug,
        name,
        kind: normalizeKind(input.kind),
        scope: normalizeScope(input.scope),
        status: "draft",
        description: String(input.description ?? ""),
        tags: parseStringArray(input.tags),
        visibility: optionalString(input.visibility),
        ownerOrgId: optionalString(input.ownerOrgId),
        ownerTeamId: optionalString(input.ownerTeamId),
        ownerUserId: optionalString(input.ownerUserId),
        createdBy: "system",
        updatedBy: "system",
      });
      return { asset: serializeAsset(asset) };
    }) as unknown as AssetResponse;
  }

  updateDraft(assetId: string, input: Record<string, unknown>): AssetResponse {
    assertSafeAdminPayload(input);
    if ("content" in input) throw ASSET_ERROR.updateNotAllowed();
    if ("slug" in input || "kind" in input) throw ASSET_ERROR.updateNotAllowed();
    if (this.repo) {
      const asset = this.repo.assets.find((item) => item.id === assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      if (asset.status === "archived") throw ASSET_ERROR.archived();
      if (asset.status !== "draft" && asset.status !== "rejected") throw ASSET_ERROR.updateNotAllowed();

      if (input.name !== undefined) asset.name = String(input.name).trim();
      if (input.description !== undefined) asset.description = String(input.description ?? "");
      if (input.tags !== undefined) asset.tags = parseStringArray(input.tags);
      if (input.visibility !== undefined) asset.visibility = optionalString(input.visibility);
      if (input.ownerTeamId !== undefined) asset.ownerTeamId = optionalString(input.ownerTeamId);
      if (input.ownerUserId !== undefined) asset.ownerUserId = optionalString(input.ownerUserId);
      if (asset.status === "rejected") asset.status = "draft";
      asset.updatedBy = "system";
      asset.updatedAt = new Date().toISOString();
      return { asset: serializeAsset(asset) };
    }

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      if (asset.status === "archived") throw ASSET_ERROR.archived();
      if (asset.status !== "draft" && asset.status !== "rejected") throw ASSET_ERROR.updateNotAllowed();
      const updated = await tx.assets.updateAssetDraft({
        assetId,
        ...(input.name !== undefined ? { name: String(input.name).trim() } : {}),
        ...(input.description !== undefined ? { description: String(input.description ?? "") } : {}),
        ...(input.tags !== undefined ? { tags: parseStringArray(input.tags) } : {}),
        ...(input.visibility !== undefined ? { visibility: optionalString(input.visibility) } : {}),
        ...(input.ownerTeamId !== undefined ? { ownerTeamId: optionalString(input.ownerTeamId) } : {}),
        ...(input.ownerUserId !== undefined ? { ownerUserId: optionalString(input.ownerUserId) } : {}),
        updatedBy: "system",
      });
      return { asset: serializeAsset(updated) };
    }) as unknown as AssetResponse;
  }

  archive(assetId: string, input: Record<string, unknown>): AssetResponse {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw ASSET_ERROR.createInvalid("归档原因不能为空");
    if (this.repo) {
      const asset = this.repo.assets.find((item) => item.id === assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      asset.status = "archived";
      asset.archivedAt = new Date().toISOString();
      asset.updatedBy = "system";
      asset.updatedAt = new Date().toISOString();
      return { asset: serializeAsset(asset) };
    }

    return this.transactionManager!.runInTransaction(async (tx) => {
      const asset = await tx.assets.findAssetById(assetId);
      if (!asset) throw ASSET_ERROR.notFound();
      const archived = await tx.assets.archiveAsset({
        assetId,
        archivedAt: new Date().toISOString(),
        updatedBy: "system",
      });
      return { asset: serializeAsset(archived) };
    }) as unknown as AssetResponse;
  }
}
