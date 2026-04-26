import {
  assertSafeAgentProfilePayload,
  computeAgentProfileChecksum,
  normalizeAgentProfileContent,
  normalizeScope,
  optionalString,
  serializeAgentProfileDetail,
  validateAgentProfileContent,
} from "./agent-profile-admin-shared";
import { AGENT_PROFILE_ERROR } from "./agent-profile-governance-errors";
import type { HubRepository } from "./repository";

export class AgentProfileGovernanceService {
  constructor(private readonly repo: HubRepository) {}

  createDraft(input: Record<string, unknown>) {
    assertSafeAgentProfilePayload(input);
    const slug = String(input.slug ?? "").trim();
    const name = String(input.name ?? "").trim();
    const version = String(input.version ?? "").trim();
    if (!slug || !name || !version) throw AGENT_PROFILE_ERROR.createInvalid();
    if (this.repo.agentProfiles.some((item) => item.slug === slug && item.version === version)) {
      throw AGENT_PROFILE_ERROR.versionExists();
    }
    const content = normalizeAgentProfileContent(input.content, { slug, name });
    const profile = this.repo.createAgentProfile({
      slug,
      name,
      description: input.description ? String(input.description) : "",
      version,
      scope: normalizeScope(input.scope),
      status: "draft",
      content,
      ownerOrgId: optionalString(input.ownerOrgId),
      ownerTeamId: optionalString(input.ownerTeamId),
      ownerUserId: optionalString(input.ownerUserId),
      riskLevel: content.riskLevel,
      createdBy: "system",
    });
    profile.checksum = computeAgentProfileChecksum(content);
    return serializeAgentProfileDetail(profile);
  }

  updateDraft(profileId: string, input: Record<string, unknown>) {
    assertSafeAgentProfilePayload(input);
    if ("slug" in input || "version" in input) throw AGENT_PROFILE_ERROR.updateNotAllowed();
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    if (profile.status === "archived") throw AGENT_PROFILE_ERROR.archived();
    if (profile.status !== "draft" && profile.status !== "rejected") throw AGENT_PROFILE_ERROR.updateNotAllowed();
    if (input.name !== undefined) profile.name = String(input.name).trim();
    if (input.description !== undefined) profile.description = String(input.description ?? "");
    if (input.ownerTeamId !== undefined) profile.ownerTeamId = optionalString(input.ownerTeamId);
    if (input.ownerUserId !== undefined) profile.ownerUserId = optionalString(input.ownerUserId);
    if (input.content !== undefined) {
      const content = normalizeAgentProfileContent(input.content, { slug: profile.slug, name: profile.name });
      profile.content = content;
      profile.riskLevel = content.riskLevel;
      profile.checksum = computeAgentProfileChecksum(content);
    }
    profile.updatedAt = new Date().toISOString();
    return serializeAgentProfileDetail(profile);
  }

  publish(profileId: string, input: Record<string, unknown> = {}) {
    assertSafeAgentProfilePayload(input);
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    if (profile.status !== "draft" && profile.status !== "reviewing") throw AGENT_PROFILE_ERROR.publishNotAllowed();
    if (!profile.content) throw AGENT_PROFILE_ERROR.contentRequired();
    if (!profile.checksum) throw AGENT_PROFILE_ERROR.checksumRequired();
    const validation = validateAgentProfileContent(profile.content);
    if (!validation.valid) throw AGENT_PROFILE_ERROR.securityInvalid(validation.errors[0]?.message);
    profile.checksum = computeAgentProfileChecksum(profile.content);
    profile.status = "published";
    profile.publishedAt = new Date().toISOString();
    profile.publishedBy = "system";
    profile.updatedAt = new Date().toISOString();
    return serializeAgentProfileDetail(profile);
  }

  deprecate(profileId: string, input: Record<string, unknown>) {
    assertSafeAgentProfilePayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw AGENT_PROFILE_ERROR.createInvalid("废弃原因不能为空");
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    if (profile.status !== "published") throw AGENT_PROFILE_ERROR.deprecateNotAllowed();
    profile.status = "deprecated";
    profile.deprecatedAt = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    return serializeAgentProfileDetail(profile);
  }

  archive(profileId: string, input: Record<string, unknown>) {
    assertSafeAgentProfilePayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw AGENT_PROFILE_ERROR.createInvalid("归档原因不能为空");
    const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
    if (!profile) throw AGENT_PROFILE_ERROR.notFound();
    profile.status = "archived";
    profile.archivedAt = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    return serializeAgentProfileDetail(profile);
  }
}
