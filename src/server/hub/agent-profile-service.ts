import { AgentProfileValidator } from "./agent-profile-validator";
import { HubError } from "./errors";
import { HubRepository } from "./repository";

export class AgentProfileService {
  private readonly validator = new AgentProfileValidator();

  constructor(private readonly repo: HubRepository) {}

  export(input: { slug: string; version?: string }) {
    const profile = this.repo.agentProfiles.find(
      (item) => item.slug === input.slug && item.status === "published" && (!input.version || item.version === input.version),
    );
    if (!profile) {
      throw new HubError("AGENT_PROFILE_NOT_FOUND", "Agent Profile 不存在或未发布", "请确认 slug 和 version。", 404);
    }
    this.validator.assertValid(profile.content);
    if (!profile.checksum) {
      throw new HubError("CHECKSUM_REQUIRED", "Agent Profile checksum 不能为空", "请重新生成 checksum。", 400);
    }
    return {
      slug: profile.slug,
      version: profile.version,
      content: profile.content,
      checksum: profile.checksum,
    };
  }
}
