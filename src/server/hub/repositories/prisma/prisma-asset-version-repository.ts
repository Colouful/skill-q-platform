import type { AssetVersionRepositoryPort } from "../ports/asset-version-repository-port";
import type {
  CreateAssetVersionInput,
  DeprecateAssetVersionInput,
  PrismaDelegateLike,
  PrismaHubClientLike,
  PublishAssetVersionInput,
} from "../repository-types";
import { mapPrismaAssetVersion } from "./prisma-mappers";

async function updateRequired(delegate: PrismaDelegateLike, args: unknown) {
  if (!delegate.update) throw new Error("Prisma Asset Version Repository 缺少 update 方法，无法执行写事务。");
  return delegate.update(args);
}

export class PrismaAssetVersionRepository implements AssetVersionRepositoryPort {
  constructor(private readonly prisma: PrismaHubClientLike) {}

  async createAssetVersion(input: CreateAssetVersionInput) {
    const version = await this.prisma.hubAssetVersion.create({
      data: {
        assetId: input.assetId,
        version: input.version,
        content: input.content,
        contentFormat: input.contentFormat,
        checksum: input.checksum,
        status: input.status ?? "draft",
        immutable: input.immutable ?? false,
        qualityScore: input.qualityScore ?? 0,
        dependencies: input.dependencies ?? [],
        compatibility: input.compatibility ?? {},
        changelog: input.changelog ?? null,
        createdBy: input.createdBy ?? null,
        publishedBy: input.publishedBy ?? null,
        source: input.source ?? null,
        contentSize: input.contentSize ?? input.content.length,
        previousVersionId: input.previousVersionId ?? null,
      },
    });
    return mapPrismaAssetVersion(version);
  }

  async findAssetVersionByAssetAndId(assetId: string, versionId: string) {
    const version = await this.prisma.hubAssetVersion.findFirst({ where: { id: versionId, assetId } });
    return version ? mapPrismaAssetVersion(version) : null;
  }

  async findAssetVersionByAssetAndVersion(assetId: string, version: string) {
    const item = await this.prisma.hubAssetVersion.findFirst({ where: { assetId, version } });
    return item ? mapPrismaAssetVersion(item) : null;
  }

  async publishAssetVersion(input: PublishAssetVersionInput) {
    const version = await updateRequired(this.prisma.hubAssetVersion, {
      where: { id: input.versionId },
      data: {
        checksum: input.checksum,
        contentSize: input.contentSize,
        status: "published",
        immutable: true,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
        publishedBy: input.publishedBy ?? "system",
      },
    });
    return mapPrismaAssetVersion(version);
  }

  async deprecateAssetVersion(input: DeprecateAssetVersionInput) {
    const version = await updateRequired(this.prisma.hubAssetVersion, {
      where: { id: input.versionId },
      data: {
        status: "deprecated",
      },
    });
    return mapPrismaAssetVersion(version);
  }
}
