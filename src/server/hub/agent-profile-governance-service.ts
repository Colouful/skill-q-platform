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
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";

type AgentProfileGovernanceServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type AgentProfileResponse = ReturnType<typeof serializeAgentProfileDetail>;

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).agentProfiles));
}

export class AgentProfileGovernanceService {
  private readonly repo?: HubRepository;
  private readonly transactionManager?: TransactionManagerPort;

  constructor(repoOrOptions?: HubRepository | AgentProfileGovernanceServiceOptions) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  createDraft(input: Record<string, unknown>): AgentProfileResponse {
    assertSafeAgentProfilePayload(input);
    const slug = String(input.slug ?? "").trim();
    const name = String(input.name ?? "").trim();
    const version = String(input.version ?? "").trim();
    if (!slug || !name || !version) throw AGENT_PROFILE_ERROR.createInvalid();
    const content = normalizeAgentProfileContent(input.content, { slug, name });
    const checksum = computeAgentProfileChecksum(content);
    const createInput = {
      slug,
      name,
      description: input.description ? String(input.description) : "",
      version,
      scope: normalizeScope(input.scope),
      status: "draft",
      content,
      checksum,
      ownerOrgId: optionalString(input.ownerOrgId),
      ownerTeamId: optionalString(input.ownerTeamId),
      ownerUserId: optionalString(input.ownerUserId),
      riskLevel: content.riskLevel,
      createdBy: "system",
    } as const;
    if (this.repo) {
      if (this.repo.agentProfiles.some((item) => item.slug === slug && item.version === version)) {
        throw AGENT_PROFILE_ERROR.versionExists();
      }
      const profile = this.repo.createAgentProfile(createInput);
      profile.checksum = checksum;
      return serializeAgentProfileDetail(profile);
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      if (await tx.agentProfiles.findAgentProfileBySlugAndVersion(slug, version)) {
        throw AGENT_PROFILE_ERROR.versionExists();
      }
      const profile = await tx.agentProfiles.createAgentProfile(createInput);
      return serializeAgentProfileDetail(profile);
    }) as unknown as AgentProfileResponse;
  }

  updateDraft(profileId: string, input: Record<string, unknown>): AgentProfileResponse {
    assertSafeAgentProfilePayload(input);
    if ("slug" in input || "version" in input) throw AGENT_PROFILE_ERROR.updateNotAllowed();
    if (this.repo) {
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
      if (profile.status === "rejected") {
        profile.status = "draft";
        profile.rejectedAt = null;
        profile.rejectedReason = null;
      }
      profile.updatedAt = new Date().toISOString();
      return serializeAgentProfileDetail(profile);
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw AGENT_PROFILE_ERROR.notFound();
      if (profile.status === "archived") throw AGENT_PROFILE_ERROR.archived();
      if (profile.status !== "draft" && profile.status !== "rejected") throw AGENT_PROFILE_ERROR.updateNotAllowed();
      const nextName = input.name !== undefined ? String(input.name).trim() : profile.name;
      const content = input.content !== undefined
        ? normalizeAgentProfileContent(input.content, { slug: profile.slug, name: nextName })
        : undefined;
      const updated = await tx.agentProfiles.updateAgentProfileDraft({
        profileId,
        ...(input.name !== undefined ? { name: nextName } : {}),
        ...(input.description !== undefined ? { description: String(input.description ?? "") } : {}),
        ...(input.ownerTeamId !== undefined ? { ownerTeamId: optionalString(input.ownerTeamId) } : {}),
        ...(input.ownerUserId !== undefined ? { ownerUserId: optionalString(input.ownerUserId) } : {}),
        ...(content ? { content, riskLevel: content.riskLevel, checksum: computeAgentProfileChecksum(content) } : {}),
      });
      return serializeAgentProfileDetail(updated);
    }) as unknown as AgentProfileResponse;
  }

  publish(profileId: string, input: Record<string, unknown> = {}): AgentProfileResponse {
    assertSafeAgentProfilePayload(input);
    if (this.repo) {
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
    return this.transactionManager!.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw AGENT_PROFILE_ERROR.notFound();
      if (profile.status !== "draft" && profile.status !== "reviewing") throw AGENT_PROFILE_ERROR.publishNotAllowed();
      if (!profile.content) throw AGENT_PROFILE_ERROR.contentRequired();
      if (!profile.checksum) throw AGENT_PROFILE_ERROR.checksumRequired();
      const validation = validateAgentProfileContent(profile.content);
      if (!validation.valid) throw AGENT_PROFILE_ERROR.securityInvalid(validation.errors[0]?.message);
      const statusFrom = profile.status;
      const checksum = computeAgentProfileChecksum(profile.content);
      if (!checksum) throw AGENT_PROFILE_ERROR.checksumRequired();
      const publishedAt = new Date().toISOString();
      const published = await tx.agentProfiles.publishAgentProfile({
        profileId,
        checksum,
        publishedAt,
        publishedBy: "system",
      });
      await tx.auditLogs.createAuditLog({
        targetType: "agent-profile",
        targetId: profileId,
        targetSlug: profile.slug,
        targetVersion: profile.version,
        action: "publish",
        statusFrom,
        statusTo: "published",
        note: input.publishNote ? String(input.publishNote) : undefined,
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return serializeAgentProfileDetail(published);
    }) as unknown as AgentProfileResponse;
  }

  deprecate(profileId: string, input: Record<string, unknown>): AgentProfileResponse {
    assertSafeAgentProfilePayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw AGENT_PROFILE_ERROR.createInvalid("废弃原因不能为空");
    if (this.repo) {
      const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
      if (!profile) throw AGENT_PROFILE_ERROR.notFound();
      if (profile.status !== "published") throw AGENT_PROFILE_ERROR.deprecateNotAllowed();
      profile.status = "deprecated";
      profile.deprecatedAt = new Date().toISOString();
      profile.updatedAt = new Date().toISOString();
      return serializeAgentProfileDetail(profile);
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw AGENT_PROFILE_ERROR.notFound();
      if (profile.status !== "published") throw AGENT_PROFILE_ERROR.deprecateNotAllowed();
      const deprecated = await tx.agentProfiles.deprecateAgentProfile({
        profileId,
        deprecatedAt: new Date().toISOString(),
      });
      await tx.auditLogs.createAuditLog({
        targetType: "agent-profile",
        targetId: profileId,
        targetSlug: profile.slug,
        targetVersion: profile.version,
        action: "deprecate",
        statusFrom: profile.status,
        statusTo: "deprecated",
        reason,
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return serializeAgentProfileDetail(deprecated);
    }) as unknown as AgentProfileResponse;
  }

  archive(profileId: string, input: Record<string, unknown>): AgentProfileResponse {
    assertSafeAgentProfilePayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw AGENT_PROFILE_ERROR.createInvalid("归档原因不能为空");
    if (this.repo) {
      const profile = this.repo.agentProfiles.find((item) => item.id === profileId);
      if (!profile) throw AGENT_PROFILE_ERROR.notFound();
      profile.status = "archived";
      profile.archivedAt = new Date().toISOString();
      profile.updatedAt = new Date().toISOString();
      return serializeAgentProfileDetail(profile);
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const profile = await tx.agentProfiles.findAgentProfileById(profileId);
      if (!profile) throw AGENT_PROFILE_ERROR.notFound();
      const archived = await tx.agentProfiles.archiveAgentProfile({
        profileId,
        archivedAt: new Date().toISOString(),
      });
      await tx.auditLogs.createAuditLog({
        targetType: "agent-profile",
        targetId: profileId,
        targetSlug: profile.slug,
        targetVersion: profile.version,
        action: "archive",
        statusFrom: profile.status,
        statusTo: "archived",
        reason,
        operatorId: "system",
        operatorName: "系统",
        operatorType: "system",
      });
      return serializeAgentProfileDetail(archived);
    }) as unknown as AgentProfileResponse;
  }
}
