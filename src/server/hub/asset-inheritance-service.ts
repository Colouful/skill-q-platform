import { ASSET_ERROR } from "./asset-governance-errors";
import { assertSafeAdminPayload, normalizeScope, optionalString, parseStringArray } from "./asset-admin-shared";
import type { HubRepository } from "./repository";
import { defaultHubRepository } from "./seed";
import type { HubAsset } from "./types";

const PROTECTED_OVERRIDE_FIELDS = new Set([
  "id",
  "slug",
  "kind",
  "status",
  "latestVersionId",
  "checksum",
  "content",
  "contentFormat",
  "immutable",
  "publishedAt",
  "publishedBy",
  "sourceCode",
  "rawPrompt",
  "rawResponse",
  "secret",
  "token",
]);

function assertAllowedOverride(fields: Record<string, unknown>) {
  const invalid = Object.keys(fields).find((key) => PROTECTED_OVERRIDE_FIELDS.has(key));
  if (invalid) {
    throw ASSET_ERROR.createInvalid(`禁止覆盖核心安全字段：${invalid}`);
  }
}

function serialize(asset: HubAsset) {
  return {
    id: asset.id,
    slug: asset.slug,
    name: asset.name,
    kind: asset.kind,
    scope: asset.scope,
    status: asset.status === "published" ? "active" : asset.status,
    description: asset.description,
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    parentAssetId: asset.parentAssetId ?? undefined,
    overrideFields: asset.overrideFields ?? undefined,
    metadata: asset.metadata ?? {},
    latestVersionId: asset.latestVersionId ?? undefined,
    updatedAt: asset.updatedAt,
  };
}

export class AssetInheritanceService {
  constructor(private readonly repo: HubRepository = defaultHubRepository) {}

  fork(parentAssetId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const parent = this.findAsset(parentAssetId);
    const slug = String(input.slug ?? `${parent.slug}-fork-${Date.now()}`).trim();
    const scope = normalizeScope(input.scope ?? "team");
    if (scope !== "team" && scope !== "project") {
      throw ASSET_ERROR.createInvalid("Fork 只能创建 team 或 project 作用域资产");
    }
    if (this.repo.assets.some((asset) => asset.slug === slug)) throw ASSET_ERROR.slugExists();
    const overrideFields = this.readOverrideFields(input.overrideFields);
    assertAllowedOverride(overrideFields);
    const child = this.repo.createAsset({
      slug,
      name: String(input.name ?? `${parent.name} Fork`),
      kind: parent.kind,
      scope,
      status: "draft",
      description: String(input.description ?? parent.description ?? ""),
      tags: input.tags !== undefined ? parseStringArray(input.tags) : Array.isArray(parent.tags) ? parent.tags : [],
      ownerOrgId: optionalString(input.ownerOrgId) ?? parent.ownerOrgId,
      ownerTeamId: optionalString(input.ownerTeamId),
      ownerUserId: optionalString(input.ownerUserId),
      createdBy: "system",
      updatedBy: "system",
    });
    child.parentAssetId = parent.id;
    child.overrideFields = overrideFields;
    child.metadata = {
      ...(parent.metadata ?? {}),
      forkedFrom: parent.slug,
      forkedAt: new Date().toISOString(),
    };
    return { asset: serialize(child), parent: serialize(parent), diff: overrideFields };
  }

  override(assetId: string, input: Record<string, unknown>) {
    assertSafeAdminPayload(input);
    const asset = this.findAsset(assetId);
    if (asset.scope !== "team" && asset.scope !== "project") {
      throw ASSET_ERROR.createInvalid("只有 team 或 project 作用域资产允许 Override");
    }
    const overrideFields = this.readOverrideFields(input.overrideFields ?? input);
    assertAllowedOverride(overrideFields);
    asset.overrideFields = {
      ...(asset.overrideFields ?? {}),
      ...overrideFields,
    };
    asset.metadata = {
      ...(asset.metadata ?? {}),
      overrideUpdatedAt: new Date().toISOString(),
    };
    asset.updatedAt = new Date().toISOString();
    return { asset: serialize(asset), effective: this.effective(asset.id).asset };
  }

  effective(assetId: string) {
    const asset = this.findAsset(assetId);
    const chain = this.resolveChain(asset);
    const merged = chain.reduce<Record<string, unknown>>((acc, item) => {
      Object.assign(acc, {
        slug: item.slug,
        name: item.name,
        kind: item.kind,
        scope: item.scope,
        description: item.description,
        tags: item.tags ?? [],
        metadata: item.metadata ?? {},
      });
      Object.assign(acc, item.overrideFields ?? {});
      return acc;
    }, {});
    return {
      asset: {
        id: asset.id,
        parentAssetId: asset.parentAssetId ?? undefined,
        ...merged,
        status: asset.status === "published" ? "active" : asset.status,
      },
      inheritanceChain: chain.map((item) => ({
        id: item.id,
        slug: item.slug,
        scope: item.scope,
      })),
    };
  }

  private resolveChain(asset: HubAsset): HubAsset[] {
    const parent = asset.parentAssetId ? this.repo.assets.find((item) => item.id === asset.parentAssetId) : undefined;
    return parent ? [...this.resolveChain(parent), asset] : [asset];
  }

  private findAsset(assetId: string) {
    const asset = this.repo.assets.find((item) => item.id === assetId || item.slug === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    return asset;
  }

  private readOverrideFields(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }
}
