import { describe, expect, it } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { createHubRepository } from "@/server/hub/repository";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";
import { createAgentProfileContent } from "../unit/agent-profiles/agent-profile-test-fixtures";

describe("Agent Profile 发布与 AuditLog 事务一致性", () => {
  it("发布成功后应写入 AuditLog", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);
    const service = new AgentProfileGovernanceService({ transactionManager: manager });
    const created = await service.createDraft({
      slug: "agent-publish-audit",
      name: "发布审计 Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "agent-publish-audit" }),
    });

    await service.publish(created.profile.id, { publishNote: "审计一致性" });

    await expect(manager.adapter.listAuditLogs({ targetType: "agent-profile", targetId: created.profile.id })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "publish", statusFrom: "draft", statusTo: "published" }],
    });
  });

  it("AuditLog 写入失败时应回滚发布状态", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);
    const service = new AgentProfileGovernanceService({ transactionManager: manager });
    const created = await service.createDraft({
      slug: "agent-publish-rollback",
      name: "发布回滚 Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "agent-publish-rollback" }),
    });
    manager.adapter.createAuditLog = async () => {
      throw new Error("审计写入失败");
    };

    await expect(service.publish(created.profile.id, {})).rejects.toThrow("审计写入失败");

    expect(repo.agentProfiles.find((item) => item.id === created.profile.id)?.status).toBe("draft");
  });

  it("安全策略失败时应回滚状态且不写 AuditLog", async () => {
    const repo = createHubRepository();
    const manager = new MemoryTransactionManager(repo);
    const service = new AgentProfileGovernanceService({ transactionManager: manager });
    const created = await service.createDraft({
      slug: "agent-security-rollback",
      name: "安全回滚 Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "agent-security-rollback" }),
    });
    const stored = repo.agentProfiles.find((item) => item.id === created.profile.id)!;
    stored.content.contextScope.allowSourceCode = true;

    await expect(service.publish(created.profile.id, {})).rejects.toThrow("contextScope.allowSourceCode 必须为 false");

    expect(repo.agentProfiles.find((item) => item.id === created.profile.id)?.status).toBe("draft");
    await expect(manager.adapter.listAuditLogs({ targetType: "agent-profile", targetId: created.profile.id })).resolves.toMatchObject({
      pagination: { total: 0 },
    });
  });
});
