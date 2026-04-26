import { AGENT_EXECUTORS, serializeAgentProfileDetail, serializeAgentProfileSummary } from "./agent-profile-admin-shared";
import { AGENT_PROFILE_ERROR } from "./agent-profile-governance-errors";
import { HUB_STATUSES } from "./types";
import type { HubRepository } from "./repository";

export class AgentProfileQueryService {
  constructor(private readonly repo: HubRepository) {}

  list(input: URLSearchParams | Record<string, string | undefined>) {
    const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
    const page = Number(get("page") ?? 1);
    const pageSize = Number(get("pageSize") ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw AGENT_PROFILE_ERROR.invalidPagination();
    }
    const keyword = (get("keyword") ?? "").trim().toLowerCase();
    const status = get("status");
    const riskLevel = get("riskLevel");
    const defaultExecutor = get("defaultExecutor");
    const ownerTeamId = get("ownerTeamId");
    if (status && !HUB_STATUSES.includes(status as (typeof HUB_STATUSES)[number])) throw AGENT_PROFILE_ERROR.invalidStatus();
    if (defaultExecutor && !AGENT_EXECUTORS.includes(defaultExecutor as (typeof AGENT_EXECUTORS)[number])) {
      throw AGENT_PROFILE_ERROR.invalidExecutor();
    }
    const filtered = this.repo.agentProfiles.filter((profile) => {
      if (keyword && !`${profile.slug} ${profile.name}`.toLowerCase().includes(keyword)) return false;
      if (status && profile.status !== status) return false;
      if (riskLevel && (profile.riskLevel ?? profile.content.riskLevel) !== riskLevel) return false;
      if (defaultExecutor && profile.content.defaultExecutor !== defaultExecutor) return false;
      if (ownerTeamId && profile.ownerTeamId !== ownerTeamId) return false;
      return true;
    });
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map(serializeAgentProfileSummary);
    return { items, pagination: { page, pageSize, total } };
  }

  detail(profileId: string) {
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    return serializeAgentProfileDetail(profile);
  }
}
