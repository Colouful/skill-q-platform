import type { ManifestRepositoryPort } from "../ports/manifest-repository-port";
import type {
  ArchiveManifestInput,
  CreateManifestAssetBindingInput,
  CreateManifestInput,
  CreateManifestVersionInput,
  DeprecateManifestVersionInput,
  ManifestListQuery,
  MarkManifestPublishedInput,
  PrismaDelegateLike,
  PrismaHubClientLike,
  PublishManifestVersionInput,
  UpdateManifestDraftInput,
  UpdateManifestVersionChecksumInput,
} from "../repository-types";
import { parsePagination } from "../repository-types";
import {
  mapPrismaManifest,
  mapPrismaManifestAssetBinding,
  mapPrismaManifestSummary,
  mapPrismaManifestVersion,
  mapPrismaManifestVersionSummary,
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

function buildWhere(query: ManifestListQuery = {}) {
  return {
    ...keywordWhere(query.keyword),
    ...(query.status ? { status: query.status } : {}),
    ...(query.scope ? { scope: query.scope } : {}),
    ...(query.ownerTeamId ? { ownerTeamId: query.ownerTeamId } : {}),
    ...(query.techStack ? { techStacks: { array_contains: query.techStack } } : {}),
    ...(query.projectKind ? { projectKinds: { array_contains: query.projectKind } } : {}),
    ...(query.tag ? { tags: { array_contains: query.tag } } : {}),
  };
}

async function updateRequired(delegate: PrismaDelegateLike, args: unknown) {
  if (!delegate.update) throw new Error("Prisma Manifest Repository 缺少 update 方法，无法执行写事务。");
  return delegate.update(args);
}

async function deleteRequired(delegate: PrismaDelegateLike, args: unknown) {
  if (!delegate.delete) throw new Error("Prisma Manifest Repository 缺少 delete 方法，无法执行写事务。");
  return delegate.delete(args);
}

export class PrismaManifestRepository implements ManifestRepositoryPort {
  constructor(private readonly prisma: PrismaHubClientLike) {}

  async listManifests(query: ManifestListQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const where = buildWhere(query);
    const [items, total] = await Promise.all([
      this.prisma.hubManifest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          versions: {
            select: {
              id: true,
              status: true,
              assets: { select: { id: true } },
            },
          },
        },
      }),
      this.prisma.hubManifest.count({ where }),
    ]);
    return {
      items: items.map(mapPrismaManifestSummary),
      pagination: { page, pageSize, total },
    };
  }

  async findManifestById(id: string) {
    const manifest = await this.prisma.hubManifest.findUnique({ where: { id } });
    return manifest ? mapPrismaManifest(manifest) : null;
  }

  async findManifestBySlug(slug: string) {
    const manifest = await this.prisma.hubManifest.findFirst({ where: { slug } });
    return manifest ? mapPrismaManifest(manifest) : null;
  }

  async createManifest(input: CreateManifestInput) {
    const manifest = await this.prisma.hubManifest.create({
      data: {
        slug: input.slug,
        name: input.name,
        scope: input.scope,
        status: input.status ?? "draft",
        description: input.description ?? "",
        tags: input.tags ?? [],
        techStacks: input.techStacks ?? [],
        projectKinds: input.projectKinds ?? [],
        recommendedFor: input.recommendedFor ?? [],
        ownerOrgId: input.ownerOrgId ?? null,
        ownerTeamId: input.ownerTeamId ?? null,
        createdBy: input.createdBy ?? null,
        updatedBy: input.updatedBy ?? null,
      },
    });
    return mapPrismaManifest(manifest);
  }

  async updateManifestDraft(input: UpdateManifestDraftInput) {
    const manifest = await updateRequired(this.prisma.hubManifest, {
      where: { id: input.manifestId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.techStacks !== undefined ? { techStacks: input.techStacks } : {}),
        ...(input.projectKinds !== undefined ? { projectKinds: input.projectKinds } : {}),
        ...(input.recommendedFor !== undefined ? { recommendedFor: input.recommendedFor } : {}),
        ...(input.ownerTeamId !== undefined ? { ownerTeamId: input.ownerTeamId } : {}),
        status: "draft",
        updatedBy: input.updatedBy ?? "system",
      },
    });
    return mapPrismaManifest(manifest);
  }

  async archiveManifest(input: ArchiveManifestInput) {
    const manifest = await updateRequired(this.prisma.hubManifest, {
      where: { id: input.manifestId },
      data: {
        status: "archived",
        archivedAt: input.archivedAt ? new Date(input.archivedAt) : new Date(),
        updatedBy: input.updatedBy ?? "system",
      },
    });
    return mapPrismaManifest(manifest);
  }

  async markManifestPublished(input: MarkManifestPublishedInput) {
    const manifest = await updateRequired(this.prisma.hubManifest, {
      where: { id: input.manifestId },
      data: {
        status: "published",
        latestVersionId: input.latestVersionId,
        updatedBy: input.updatedBy ?? "system",
      },
    });
    return mapPrismaManifest(manifest);
  }

  async listManifestVersions(manifestId: string) {
    const versions = await this.prisma.hubManifestVersion.findMany({
      where: { manifestId },
      orderBy: { createdAt: "desc" },
      include: {
        assets: { select: { id: true } },
      },
    });
    return versions.map(mapPrismaManifestVersionSummary);
  }

  async findManifestVersionById(versionId: string) {
    const version = await this.prisma.hubManifestVersion.findUnique({ where: { id: versionId } });
    return version ? mapPrismaManifestVersion(version) : null;
  }

  async createManifestVersion(input: CreateManifestVersionInput) {
    const version = await this.prisma.hubManifestVersion.create({
      data: {
        manifestId: input.manifestId,
        version: input.version,
        status: input.status ?? "draft",
        checksum: input.checksum ?? "",
        installPolicy: input.installPolicy ?? {
          defaultExecutor: "cursor",
          fallbackExecutors: ["claude-code", "codex"],
        },
        compatibility: input.compatibility ?? {},
        changelog: input.changelog ?? null,
        createdBy: input.createdBy ?? null,
        publishedBy: input.publishedBy ?? null,
        previousVersionId: input.previousVersionId ?? null,
        exportSchemaVersion: input.exportSchemaVersion ?? null,
      },
    });
    return mapPrismaManifestVersion(version);
  }

  async findManifestVersionByManifestAndId(manifestId: string, versionId: string) {
    const version = await this.prisma.hubManifestVersion.findFirst({ where: { id: versionId, manifestId } });
    return version ? mapPrismaManifestVersion(version) : null;
  }

  async findManifestVersionByManifestAndVersion(manifestId: string, version: string) {
    const item = await this.prisma.hubManifestVersion.findFirst({ where: { manifestId, version } });
    return item ? mapPrismaManifestVersion(item) : null;
  }

  async publishManifestVersion(input: PublishManifestVersionInput) {
    const version = await updateRequired(this.prisma.hubManifestVersion, {
      where: { id: input.versionId },
      data: {
        checksum: input.checksum,
        status: "published",
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
        publishedBy: input.publishedBy ?? "system",
      },
    });
    return mapPrismaManifestVersion(version);
  }

  async deprecateManifestVersion(input: DeprecateManifestVersionInput) {
    const version = await updateRequired(this.prisma.hubManifestVersion, {
      where: { id: input.versionId },
      data: { status: "deprecated" },
    });
    return mapPrismaManifestVersion(version);
  }

  async updateManifestVersionChecksum(input: UpdateManifestVersionChecksumInput) {
    const version = await updateRequired(this.prisma.hubManifestVersion, {
      where: { id: input.versionId },
      data: { checksum: input.checksum },
    });
    return mapPrismaManifestVersion(version);
  }

  async listManifestAssetBindings(manifestVersionId: string) {
    const bindings = await this.prisma.hubManifestAsset.findMany({
      where: { manifestVersionId },
      orderBy: { order: "asc" },
      include: {
        asset: true,
        assetVersion: true,
      },
    });
    return bindings.map(mapPrismaManifestAssetBinding);
  }

  async createBinding(input: CreateManifestAssetBindingInput) {
    const binding = await this.prisma.hubManifestAsset.create({
      data: {
        manifestVersionId: input.manifestVersionId,
        assetId: input.assetId,
        assetVersionId: input.assetVersionId,
        kind: input.kind,
        required: input.required ?? true,
        loadWhen: input.loadWhen ?? [],
        order: input.order ?? 0,
        alias: input.alias ?? null,
        reason: input.reason ?? null,
        stage: input.stage ?? null,
        addedBy: input.addedBy ?? null,
        addedAt: input.addedAt ? new Date(input.addedAt) : new Date(),
        policy: input.policy ?? {},
      },
      include: { asset: true, assetVersion: true },
    });
    return mapPrismaManifestAssetBinding(binding);
  }

  async deleteBinding(manifestVersionId: string, bindingId: string) {
    await deleteRequired(this.prisma.hubManifestAsset, { where: { id: bindingId, manifestVersionId } });
  }

  async reorderBindings(manifestVersionId: string, items: Array<{ bindingId: string; order: number }>) {
    for (const item of items) {
      await updateRequired(this.prisma.hubManifestAsset, {
        where: { id: item.bindingId },
        data: { order: item.order },
      });
    }
    return this.listManifestAssetBindings(manifestVersionId);
  }

  async findBindingById(manifestVersionId: string, bindingId: string) {
    const binding = await this.prisma.hubManifestAsset.findFirst({
      where: { id: bindingId, manifestVersionId },
      include: { asset: true, assetVersion: true },
    });
    return binding ? mapPrismaManifestAssetBinding(binding) : null;
  }

  async findBindingByAssetVersion(manifestVersionId: string, assetVersionId: string) {
    const binding = await this.prisma.hubManifestAsset.findFirst({
      where: { manifestVersionId, assetVersionId },
      include: { asset: true, assetVersion: true },
    });
    return binding ? mapPrismaManifestAssetBinding(binding) : null;
  }

  async listBindingsForChecksum(manifestVersionId: string) {
    return this.listManifestAssetBindings(manifestVersionId);
  }
}
