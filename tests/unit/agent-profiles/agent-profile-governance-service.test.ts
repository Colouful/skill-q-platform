import { describe, expect, it } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { createHubRepository } from "@/server/hub/repository";
import { createAgentProfileContent, createAgentProfileFixture } from "./agent-profile-test-fixtures";

describe("AgentProfileGovernanceService", () => {
  it("应创建 draft agent profile 并自动补齐默认安全策略", () => {
    const repo = createHubRepository();
    const service = new AgentProfileGovernanceService(repo);
    const result = service.createDraft({
      slug: "draft-agent",
      name: "Draft Agent",
      version: "1.0.0",
      content: {
        slug: "draft-agent",
        name: "Draft Agent",
        defaultExecutor: "cursor",
        fallbackExecutors: ["codex"],
        allowedTools: ["read"],
        deniedTools: [],
        modelPolicy: { tokenBudget: 1000, reasoningEffort: "ultra" },
        outputContract: { mustReturn: ["summary"] },
        riskLevel: "low",
      },
    });

    expect(result.profile).toEqual(
      expect.objectContaining({
        slug: "draft-agent",
        version: "1.0.0",
        status: "draft",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
    expect((result.profile.content as Record<string, unknown>).deniedTools).toEqual(["upload-source", "deploy", "push", "merge"]);
    expect((result.profile.content as { approvalPolicy: { beforePush: boolean } }).approvalPolicy.beforePush).toBe(true);
    expect((result.profile.content as { contextScope: { allowSourceCode: boolean } }).contextScope.allowSourceCode).toBe(false);
  });

  it("slug + version 重复时应报错", () => {
    const repo = createHubRepository();
    const service = new AgentProfileGovernanceService(repo);
    const input = { slug: "dup-agent", name: "重复", version: "1.0.0", content: createAgentProfileContent({ slug: "dup-agent" }) };

    service.createDraft(input);

    expect(() => service.createDraft(input)).toThrow("Agent Profile 版本已存在");
  });

  it("draft agent profile 可更新且 content 变化后 checksum 变化", () => {
    const { service, profile } = createAgentProfileFixture();
    const before = String(profile.profile.checksum);

    const updated = service.updateDraft(String(profile.profile.id), {
      name: "更新 Agent",
      content: createAgentProfileContent({ slug: String(profile.profile.slug), name: "更新 Agent", riskLevel: "high" }),
    });

    expect(updated.profile.name).toBe("更新 Agent");
    expect(updated.profile.riskLevel).toBe("high");
    expect(updated.profile.checksum).not.toBe(before);
  });

  it("published agent profile 不允许更新 content", () => {
    const { service, profile } = createAgentProfileFixture();
    service.publish(String(profile.profile.id), {});

    expect(() => service.updateDraft(String(profile.profile.id), { content: createAgentProfileContent() })).toThrow(
      "当前 Agent Profile 状态不允许修改",
    );
  });

  it("archived agent profile 不允许更新", () => {
    const { service, profile } = createAgentProfileFixture();
    service.archive(String(profile.profile.id), { reason: "归档" });

    expect(() => service.updateDraft(String(profile.profile.id), { name: "不可更新" })).toThrow("Agent Profile 已归档");
  });

  it("发布 draft profile 成功并设置 published 状态", () => {
    const { service, profile } = createAgentProfileFixture();

    const published = service.publish(String(profile.profile.id), { publishNote: "发布" });

    expect(published.profile.status).toBe("published");
    expect(published.profile.publishedAt).toEqual(expect.any(String));
  });

  it.each(["upload-source", "push", "merge", "deploy"])("发布前缺少 %s 禁止项时应失败", (tool) => {
    const { repo, service, profile } = createAgentProfileFixture();
    const stored = repo.agentProfiles.find((item) => item.id === profile.profile.id)!;
    stored.content.deniedTools = ["upload-source", "deploy", "push", "merge"].filter((item) => item !== tool);

    expect(() => service.publish(String(profile.profile.id), {})).toThrow(`deniedTools 必须包含 ${tool}`);
  });

  it.each([
    [
      "contextScope.allowSourceCode",
      (content: ReturnType<typeof createAgentProfileContent>) => (content.contextScope.allowSourceCode = true),
      "contextScope.allowSourceCode 必须为 false",
    ],
    [
      "contextScope.allowAbsolutePath",
      (content: ReturnType<typeof createAgentProfileContent>) => (content.contextScope.allowAbsolutePath = true),
      "contextScope.allowAbsolutePath 必须为 false",
    ],
    [
      "approvalPolicy.beforePush",
      (content: ReturnType<typeof createAgentProfileContent>) => (content.approvalPolicy.beforePush = false),
      "approvalPolicy.beforePush 必须为 true",
    ],
    [
      "approvalPolicy.beforeMerge",
      (content: ReturnType<typeof createAgentProfileContent>) => (content.approvalPolicy.beforeMerge = false),
      "approvalPolicy.beforeMerge 必须为 true",
    ],
    [
      "approvalPolicy.highRiskAlwaysManual",
      (content: ReturnType<typeof createAgentProfileContent>) => (content.approvalPolicy.highRiskAlwaysManual = false),
      "approvalPolicy.highRiskAlwaysManual 必须为 true",
    ],
  ])("发布前 %s 安全策略不合法时应失败", (_field, mutate, message) => {
    const { repo, service, profile } = createAgentProfileFixture();
    const stored = repo.agentProfiles.find((item) => item.id === profile.profile.id)!;
    mutate(stored.content);

    expect(() => service.publish(String(profile.profile.id), {})).toThrow(message);
  });

  it("废弃 profile 不改变 checksum", () => {
    const { service, profile } = createAgentProfileFixture();
    const published = service.publish(String(profile.profile.id), {});
    const checksum = published.profile.checksum;

    const deprecated = service.deprecate(String(profile.profile.id), { reason: "已有新版本" });

    expect(deprecated.profile.status).toBe("deprecated");
    expect(deprecated.profile.checksum).toBe(checksum);
  });
});
