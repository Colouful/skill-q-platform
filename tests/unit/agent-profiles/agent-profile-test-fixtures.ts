import { randomUUID } from "node:crypto";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { createHubRepository } from "@/server/hub/repository";
import type { HubAgentProfileContent } from "@/server/hub/types";

export function createAgentProfileContent(input: Partial<HubAgentProfileContent> = {}): HubAgentProfileContent {
  return {
    slug: input.slug ?? `agent-${randomUUID()}`,
    name: input.name ?? "测试 Agent Profile",
    defaultExecutor: input.defaultExecutor ?? "cursor",
    fallbackExecutors: input.fallbackExecutors ?? ["claude-code", "codex"],
    allowedTools: input.allowedTools ?? ["read", "write", "test"],
    deniedTools: input.deniedTools ?? ["upload-source", "deploy", "push", "merge"],
    contextScope: {
      allowSourceCode: input.contextScope?.allowSourceCode ?? false,
      allowRelativePath: input.contextScope?.allowRelativePath ?? true,
      allowAbsolutePath: input.contextScope?.allowAbsolutePath ?? false,
    },
    modelPolicy: {
      tokenBudget: input.modelPolicy?.tokenBudget ?? 80000,
      reasoningEffort: input.modelPolicy?.reasoningEffort ?? "high",
    },
    approvalPolicy: {
      beforePush: input.approvalPolicy?.beforePush ?? true,
      beforeMerge: input.approvalPolicy?.beforeMerge ?? true,
      highRiskAlwaysManual: input.approvalPolicy?.highRiskAlwaysManual ?? true,
    },
    outputContract: {
      mustReturn: input.outputContract?.mustReturn ?? ["summary", "changedFiles", "risks", "verification"],
    },
    riskLevel: input.riskLevel ?? "medium",
  };
}

export function createAgentProfileFixture() {
  const repo = createHubRepository();
  const service = new AgentProfileGovernanceService(repo);
  const slug = `agent-${randomUUID()}`;
  const profile = service.createDraft({
    slug,
    name: "测试 Agent Profile",
    version: "1.0.0",
    content: createAgentProfileContent({ slug }),
    ownerTeamId: "team-a",
  });
  return { repo, service, profile };
}
