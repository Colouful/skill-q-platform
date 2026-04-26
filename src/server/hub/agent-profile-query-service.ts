import { AGENT_EXECUTORS, serializeAgentProfileDetail } from "./agent-profile-admin-shared";
import { AGENT_PROFILE_ERROR } from "./agent-profile-governance-errors";
import { HUB_STATUSES } from "./types";
import type { HubRepository } from "./repository";
import { getHubRepositoryProvider } from "./repositories/hub-repository-provider";
import { InMemoryHubRepositoryAdapter } from "./repositories/memory/in-memory-hub-repository-adapter";
import type { AgentProfileRepositoryPort } from "./repositories/ports/agent-profile-repository-port";
import type { AgentProfileListQuery, HubAgentProfileSummary } from "./repositories/repository-types";

function isHubRepository(repo: unknown): repo is HubRepository {
  return Boolean(repo && typeof repo === "object" && Array.isArray((repo as HubRepository).agentProfiles));
}

function toRepository(repo?: HubRepository | AgentProfileRepositoryPort): AgentProfileRepositoryPort {
  if (!repo) return getHubRepositoryProvider();
  if (isHubRepository(repo)) return new InMemoryHubRepositoryAdapter(repo);
  return repo as AgentProfileRepositoryPort;
}

function readQuery(input: URLSearchParams | Record<string, string | undefined>): AgentProfileListQuery {
  const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
  const page = Number(get("page") ?? 1);
  const pageSize = Number(get("pageSize") ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw AGENT_PROFILE_ERROR.invalidPagination();
  }
  const status = get("status") || undefined;
  const defaultExecutor = get("defaultExecutor") || undefined;
  if (status && !HUB_STATUSES.includes(status as (typeof HUB_STATUSES)[number])) throw AGENT_PROFILE_ERROR.invalidStatus();
  if (defaultExecutor && !AGENT_EXECUTORS.includes(defaultExecutor as (typeof AGENT_EXECUTORS)[number])) {
    throw AGENT_PROFILE_ERROR.invalidExecutor();
  }
  return {
    keyword: get("keyword")?.trim() || undefined,
    status,
    riskLevel: get("riskLevel") || undefined,
    defaultExecutor,
    ownerTeamId: get("ownerTeamId") || undefined,
    page,
    pageSize,
  };
}

function serializeSummary(profile: HubAgentProfileSummary) {
  return {
    id: profile.id,
    slug: profile.slug,
    name: profile.name,
    version: profile.version,
    status: profile.status,
    riskLevel: profile.riskLevel ?? undefined,
    defaultExecutor: profile.defaultExecutor,
    deniedTools: profile.deniedTools,
    checksum: profile.checksum,
    ownerTeamId: profile.ownerTeamId ?? undefined,
    ownerUserId: profile.ownerUserId ?? undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    publishedAt: profile.publishedAt ?? undefined,
    rejectedAt: profile.rejectedAt ?? undefined,
    rejectedReason: profile.rejectedReason ?? undefined,
  };
}

export class AgentProfileQueryService {
  private readonly repository: AgentProfileRepositoryPort;

  constructor(repo?: HubRepository | AgentProfileRepositoryPort) {
    this.repository = toRepository(repo);
  }

  async list(input: URLSearchParams | Record<string, string | undefined>) {
    const result = await this.repository.listAgentProfiles(readQuery(input));
    return {
      ...result,
      items: result.items.map(serializeSummary),
    };
  }

  async detail(profileId: string) {
    const profile = await this.repository.findAgentProfileById(profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    return serializeAgentProfileDetail(profile);
  }

  async findAgentProfileBySlugAndVersion(slug: string, version?: string) {
    const profile = await this.repository.findAgentProfileBySlugAndVersion(slug, version);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    return serializeAgentProfileDetail(profile);
  }
}
