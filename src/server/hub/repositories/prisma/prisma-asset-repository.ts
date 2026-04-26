import type { AssetRepositoryPort } from "../ports/asset-repository-port";
import type {
  ArchiveAssetInput,
  AssetListQuery,
  CreateAssetInput,
  MarkAssetPublishedInput,
  PrismaDelegateLike,
  PrismaHubClientLike,
  UpdateAssetDraftInput,
} from "../repository-types";
import { parsePagination } from "../repository-types";
import {
  mapPrismaAsset,
  mapPrismaAssetManifestRef,
  mapPrismaAssetSummary,
  mapPrismaAssetVersion,
  mapPrismaAssetVersionSummary,
} from "./prisma-mappers";

function keywordWhere(keyword?: string) {
  const value = keyword?.trim();
  if (!value) return {};
  return {
    OR: [
      { slug: { contains: value } },
      { name: { contains: value } },
      { description: { contains: value } },
    ],
  };
}

function buildWhere(query: AssetListQuery = {}) {
  return {
    ...keywordWhere(query.keyword),
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.scope ? { scope: query.scope } : {}),
    ...(query.ownerTeamId ? { ownerTeamId: query.ownerTeamId } : {}),
    ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
    ...(query.tag ? { tags: { array_contains: query.tag } } : {}),
  };
}

async function updateRequired(delegate: PrismaDelegateLike, args: unknown) {
  if (!delegate.update) throw new Error("Prisma Asset Repository 缺少 update 方法，无法执行写事务。");
  return delegate.update(args);
}

export class PrismaAssetRepository implements AssetRepositoryPort {
  constructor(private readonly prisma: PrismaHubClientLike) {}

  async listAssets(query: AssetListQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const where = buildWhere(query);
    const [items, total] = await Promise.all([
      this.prisma.hubAsset.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          versions: {
            select: { id: true, status: true },
          },
        },
      }),
      this.prisma.hubAsset.count({ where }),
    ]);
    return {
      items: items.map(mapPrismaAssetSummary),
      pagination: { page, pageSize, total },
    };
  }

  async findAssetById(id: string) {
    const asset = await this.prisma.hubAsset.findUnique({ where: { id } });
    return asset ? mapPrismaAsset(asset) : null;
  }

  async findAssetBySlug(slug: string) {
    const asset = await this.prisma.hubAsset.findFirst({ where: { slug } });
    return asset ? mapPrismaAsset(asset) : null;
  }

  async createAsset(input: CreateAssetInput) {
    const asset = await this.prisma.hubAsset.create({
      data: {
        slug: input.slug,
        name: input.name,
        kind: input.kind,
        scope: input.scope,
        status: input.status ?? "draft",
        description: input.description ?? "",
        tags: input.tags ?? [],
        visibility: input.visibility ?? null,
        ownerOrgId: input.ownerOrgId ?? null,
        ownerTeamId: input.ownerTeamId ?? null,
        ownerUserId: input.ownerUserId ?? null,
        createdBy: input.createdBy ?? null,
        updatedBy: input.updatedBy ?? null,
      },
    });
    return mapPrismaAsset(asset);
  }

  async updateAssetDraft(input: UpdateAssetDraftInput) {
    const asset = await updateRequired(this.prisma.hubAsset, {
      where: { id: input.assetId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
        ...(input.ownerTeamId !== undefined ? { ownerTeamId: input.ownerTeamId } : {}),
        ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
        status: "draft",
        updatedBy: input.updatedBy ?? "system",
      },
    });
    return mapPrismaAsset(asset);
  }

  async archiveAsset(input: ArchiveAssetInput) {
    const asset = await updateRequired(this.prisma.hubAsset, {
      where: { id: input.assetId },
      data: {
        status: "archived",
        archivedAt: input.archivedAt ? new Date(input.archivedAt) : new Date(),
        updatedBy: input.updatedBy ?? "system",
      },
    });
    return mapPrismaAsset(asset);
  }

  async markAssetPublished(input: MarkAssetPublishedInput) {
    const asset = await updateRequired(this.prisma.hubAsset, {
      where: { id: input.assetId },
      data: {
        status: "published",
        latestVersionId: input.latestVersionId,
        updatedBy: input.updatedBy ?? "system",
      },
    });
    return mapPrismaAsset(asset);
  }

  async listAssetVersions(assetId: string) {
    const versions = await this.prisma.hubAssetVersion.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
    });
    return versions.map(mapPrismaAssetVersionSummary);
  }

  async findAssetVersionById(versionId: string) {
    const version = await this.prisma.hubAssetVersion.findUnique({ where: { id: versionId } });
    return version ? mapPrismaAssetVersion(version) : null;
  }

  async listAssetManifestRefs(assetId: string) {
    const bindings = await this.prisma.hubManifestAsset.findMany({
      where: { assetId },
      include: {
        manifestVersion: {
          include: {
            manifest: true,
          },
        },
      },
    });
    return bindings.map(mapPrismaAssetManifestRef);
  }
}
