import type { AgentProfileRepositoryPort } from "../ports/agent-profile-repository-port";
import type {
  AgentProfileListQuery,
  ArchiveAgentProfileInput,
  CreateAgentProfileInput,
  DeprecateAgentProfileInput,
  PrismaDelegateLike,
  PrismaHubClientLike,
  PublishAgentProfileInput,
  RejectAgentProfileReviewInput,
  SubmitAgentProfileReviewInput,
  UpdateAgentProfileDraftInput,
} from "../repository-types";
import { parsePagination } from "../repository-types";
import { mapPrismaAgentProfile, mapPrismaAgentProfileSummary } from "./prisma-mappers";

function keywordWhere(keyword?: string) {
  const value = keyword?.trim();
  if (!value) return {};
  return {
    OR: [
      { slug: { contains: value } },
      { name: { contains: value } },
    ],
  };
}

function buildWhere(query: AgentProfileListQuery = {}) {
  return {
    ...keywordWhere(query.keyword),
    ...(query.status ? { status: query.status } : {}),
    ...(query.riskLevel ? { riskLevel: query.riskLevel } : {}),
    ...(query.ownerTeamId ? { ownerTeamId: query.ownerTeamId } : {}),
  };
}

async function updateRequired(delegate: PrismaDelegateLike, args: unknown) {
  if (!delegate.update) throw new Error("Prisma Agent Profile Repository 缺少 update 方法，无法执行写事务。");
  return delegate.update(args);
}

export class PrismaAgentProfileRepository implements AgentProfileRepositoryPort {
  constructor(private readonly prisma: PrismaHubClientLike) {}

  async listAgentProfiles(query: AgentProfileListQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const where = buildWhere(query);
    if (query.defaultExecutor) {
      const items = await this.prisma.hubAgentProfile.findMany({
        where,
        orderBy: { updatedAt: "desc" },
      });
      const summaries = items
        .map(mapPrismaAgentProfileSummary)
        .filter((profile) => profile.defaultExecutor === query.defaultExecutor);
      return {
        items: summaries.slice((page - 1) * pageSize, page * pageSize),
        pagination: { page, pageSize, total: summaries.length },
      };
    }
    const [items, total] = await Promise.all([
      this.prisma.hubAgentProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.hubAgentProfile.count({ where }),
    ]);
    return {
      items: items.map(mapPrismaAgentProfileSummary),
      pagination: { page, pageSize, total },
    };
  }

  async findAgentProfileById(id: string) {
    const profile = await this.prisma.hubAgentProfile.findUnique({ where: { id } });
    return profile ? mapPrismaAgentProfile(profile) : null;
  }

  async findAgentProfileBySlugAndVersion(slug: string, version?: string) {
    const profile = await this.prisma.hubAgentProfile.findFirst({
      where: {
        slug,
        ...(version ? { version } : { status: "published" }),
      },
      orderBy: { publishedAt: "desc" },
    });
    return profile ? mapPrismaAgentProfile(profile) : null;
  }

  async createAgentProfile(input: CreateAgentProfileInput) {
    const profile = await this.prisma.hubAgentProfile.create({
      data: {
        slug: input.slug,
        name: input.name,
        scope: input.scope,
        status: input.status ?? "draft",
        version: input.version,
        content: input.content,
        checksum: input.checksum,
        ownerOrgId: input.ownerOrgId ?? null,
        ownerTeamId: input.ownerTeamId ?? null,
        ownerUserId: input.ownerUserId ?? null,
        riskLevel: input.riskLevel ?? input.content.riskLevel,
        createdBy: input.createdBy ?? null,
        publishedBy: input.publishedBy ?? null,
      },
    });
    return mapPrismaAgentProfile(profile);
  }

  async updateAgentProfileDraft(input: UpdateAgentProfileDraftInput) {
    const profile = await updateRequired(this.prisma.hubAgentProfile, {
      where: { id: input.profileId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.checksum !== undefined ? { checksum: input.checksum } : {}),
        ...(input.ownerTeamId !== undefined ? { ownerTeamId: input.ownerTeamId } : {}),
        ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
        ...(input.riskLevel !== undefined ? { riskLevel: input.riskLevel } : {}),
        status: "draft",
      },
    });
    return mapPrismaAgentProfile(profile);
  }

  async submitAgentProfileReview(input: SubmitAgentProfileReviewInput) {
    const profile = await updateRequired(this.prisma.hubAgentProfile, {
      where: { id: input.profileId },
      data: { status: "reviewing" },
    });
    return mapPrismaAgentProfile(profile);
  }

  async rejectAgentProfileReview(input: RejectAgentProfileReviewInput) {
    const profile = await updateRequired(this.prisma.hubAgentProfile, {
      where: { id: input.profileId },
      data: { status: "rejected" },
    });
    return mapPrismaAgentProfile(profile);
  }

  async publishAgentProfile(input: PublishAgentProfileInput) {
    const profile = await updateRequired(this.prisma.hubAgentProfile, {
      where: { id: input.profileId },
      data: {
        checksum: input.checksum,
        status: "published",
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
        publishedBy: input.publishedBy ?? "system",
      },
    });
    return mapPrismaAgentProfile(profile);
  }

  async deprecateAgentProfile(input: DeprecateAgentProfileInput) {
    const profile = await updateRequired(this.prisma.hubAgentProfile, {
      where: { id: input.profileId },
      data: {
        status: "deprecated",
        deprecatedAt: input.deprecatedAt ? new Date(input.deprecatedAt) : new Date(),
      },
    });
    return mapPrismaAgentProfile(profile);
  }

  async archiveAgentProfile(input: ArchiveAgentProfileInput) {
    const profile = await updateRequired(this.prisma.hubAgentProfile, {
      where: { id: input.profileId },
      data: {
        status: "archived",
        archivedAt: input.archivedAt ? new Date(input.archivedAt) : new Date(),
      },
    });
    return mapPrismaAgentProfile(profile);
  }
}
