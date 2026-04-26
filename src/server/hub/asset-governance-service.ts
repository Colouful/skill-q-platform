import { ASSET_ERROR } from "./asset-governance-errors";
import { assertSafeAdminPayload, normalizeKind, normalizeScope, optionalString, parseStringArray, serializeAsset } from "./asset-admin-shared";
import type { HubRepository } from "./repository";

export class AssetGovernanceService {
  constructor(private readonly repo: HubRepository) {}

  createDraft(input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const slug = String(input.slug ?? "").trim();
    const name = String(input.name ?? "").trim();
    if (!slug || !name || !input.kind || !input.scope) throw ASSET_ERROR.createInvalid();
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

  updateDraft(assetId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    if ("content" in input) throw ASSET_ERROR.updateNotAllowed();
    if ("slug" in input || "kind" in input) throw ASSET_ERROR.updateNotAllowed();
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
    asset.updatedBy = "system";
    asset.updatedAt = new Date().toISOString();
    return { asset: serializeAsset(asset) };
  }

  archive(assetId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw ASSET_ERROR.createInvalid("归档原因不能为空");
    const asset = this.repo.assets.find((item) => item.id === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    asset.status = "archived";
    asset.archivedAt = new Date().toISOString();
    asset.updatedBy = "system";
    asset.updatedAt = new Date().toISOString();
    return { asset: serializeAsset(asset) };
  }
}
