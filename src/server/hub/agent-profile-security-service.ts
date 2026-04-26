import {
  normalizeAgentProfileContent,
  validateAgentProfileContent,
} from "./agent-profile-admin-shared";
import { AGENT_PROFILE_ERROR } from "./agent-profile-governance-errors";
import type { HubRepository } from "./repository";

export class AgentProfileSecurityService {
  constructor(private readonly repo?: HubRepository) {}

  normalize(content: unknown, fallback: { slug: string; name: string }) {
    return normalizeAgentProfileContent(content, fallback);
  }

  validateContent(content: unknown) {
    return validateAgentProfileContent(content);
  }

  validateProfile(profileId: string) {
    if (!this.repo) throw AGENT_PROFILE_ERROR.notFound();
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    return this.validateContent(profile.content);
  }
}
