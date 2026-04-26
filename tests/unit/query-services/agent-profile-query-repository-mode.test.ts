import { describe, expect, it, vi } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { AgentProfileQueryService } from "@/server/hub/agent-profile-query-service";
import { createHubRepository } from "@/server/hub/repository";
import { PrismaHubRepository } from "@/server/hub/repositories/prisma/prisma-hub-repository";
import type { PrismaDelegateLike, PrismaHubClientLike } from "@/server/hub/repositories/repository-types";
import { createAgentProfileContent } from "../agent-profiles/agent-profile-test-fixtures";

const now = new Date("2026-04-26T00:00:00.000Z");

function delegate(items: unknown[]): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async () => items[0] ?? null),
    findUnique: vi.fn(async () => items[0] ?? null),
    count: vi.fn(async () => items.length),
    create: vi.fn(async () => ({})),
  };
}

function mockPrismaClient(): PrismaHubClientLike {
  const profile = {
    id: "profile-prisma-1",
    slug: "prisma-diagnostic-agent",
    name: "Prisma 诊断智能体",
    version: "1.0.0",
    scope: "platform",
    status: "published",
    content: {
      slug: "prisma-diagnostic-agent",
      name: "Prisma 诊断智能体",
      defaultExecutor: "cursor",
      fallbackExecutors: ["claude-code", "codex"],
      allowedTools: [],
      deniedTools: ["upload-source", "deploy", "push", "merge"],
      contextScope: { allowSourceCode: false, allowRelativePath: true, allowAbsolutePath: false },
      modelPolicy: { tokenBudget: 80000, reasoningEffort: "high" },
      approvalPolicy: { beforePush: true, beforeMerge: true, highRiskAlwaysManual: true },
      outputContract: { mustReturn: [] },
      riskLevel: "medium",
      sourceCode: "should be removed",
    },
    riskLevel: "medium",
    checksum: "profile-checksum",
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  };
  const d = delegate([]);
  return {
    hubAsset: d,
    hubAssetVersion: d,
    hubManifest: d,
    hubManifestVersion: d,
    hubManifestAsset: d,
    hubAgentProfile: delegate([profile]),
    hubInstallRecord: d,
    hubRuntimeFeedback: d,
    hubAuditLog: d,
  };
}

describe("AgentProfileQueryService Repository 模式", () => {
  it("memory 模式应返回 V2.1 兼容结构", async () => {
    const repo = createHubRepository();
    const governance = new AgentProfileGovernanceService(repo);
    governance.createDraft({
      slug: "memory-diagnostic-agent",
      name: "Memory 诊断智能体",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "memory-diagnostic-agent", name: "Memory 诊断智能体" }),
    });

    const result = await new AgentProfileQueryService(repo).list(new URLSearchParams("keyword=memory"));

    expect(result).toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "memory-diagnostic-agent", defaultExecutor: "cursor" }],
    });
    expect(result.items[0]).not.toHaveProperty("content");
  });

  it("prisma 模式应返回 V2.1 兼容结构并过滤敏感字段", async () => {
    const service = new AgentProfileQueryService(new PrismaHubRepository(mockPrismaClient()));

    const result = await service.list(new URLSearchParams("keyword=prisma"));
    const detail = await service.detail("profile-prisma-1");

    expect(result).toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "prisma-diagnostic-agent", deniedTools: ["upload-source", "deploy", "push", "merge"] }],
    });
    expect(JSON.stringify(detail)).not.toContain("sourceCode");
    expect(JSON.stringify(detail)).not.toContain("rawPrompt");
    expect(JSON.stringify(detail)).not.toContain("/Users/");
  });
});
