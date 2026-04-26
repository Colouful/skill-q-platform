import { describe, expect, it, vi } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { PrismaTransactionManager } from "@/server/hub/transactions/prisma-transaction-manager";
import type { PrismaDelegateLike, PrismaTransactionalHubClientLike } from "@/server/hub/repositories/repository-types";
import { createAgentProfileContent } from "./agent-profile-test-fixtures";

const now = new Date("2026-04-26T00:00:00.000Z");

function delegate(items: Array<Record<string, unknown>>): PrismaDelegateLike {
  return {
    findMany: vi.fn(async () => items),
    findFirst: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where ?? {} : {};
      return items.find((item) => Object.entries(where).every(([key, value]) => item[key] === value)) ?? null;
    }),
    findUnique: vi.fn(async (args?: unknown) => {
      const where = args && typeof args === "object" && "where" in args ? (args as { where?: Record<string, unknown> }).where : {};
      return items.find((item) => item.id === where?.id) ?? null;
    }),
    count: vi.fn(async () => items.length),
    create: vi.fn(async (args?: unknown) => {
      const data = args && typeof args === "object" && "data" in args ? (args as { data?: Record<string, unknown> }).data ?? {} : {};
      const item = { id: `agent-${items.length + 1}`, ...data, createdAt: now, updatedAt: now, publishedAt: null };
      items.push(item);
      return item;
    }),
    update: vi.fn(async (args?: unknown) => {
      const value = args as { where?: { id?: string }; data?: Record<string, unknown> };
      const index = items.findIndex((item) => item.id === value.where?.id);
      const next = { ...items[index], ...(value.data ?? {}), updatedAt: now };
      items[index] = next;
      return next;
    }),
  };
}

function prismaClient(agentProfiles: Array<Record<string, unknown>>, auditLogs: Array<Record<string, unknown>> = []): PrismaTransactionalHubClientLike {
  const empty = delegate([]);
  const base = {
    hubAsset: empty,
    hubAssetVersion: empty,
    hubManifest: empty,
    hubManifestVersion: empty,
    hubManifestAsset: empty,
    hubAgentProfile: delegate(agentProfiles),
    hubInstallRecord: empty,
    hubRuntimeFeedback: empty,
    hubAuditLog: delegate(auditLogs),
  };
  return { ...base, $transaction: vi.fn(async (handler) => handler(base)) };
}

describe("AgentProfileGovernanceService Prisma 写事务", () => {
  it("prisma 模式应支持 Agent Profile 创建、更新、发布、废弃和归档", async () => {
    const profiles: Array<Record<string, unknown>> = [];
    const auditLogs: Array<Record<string, unknown>> = [];
    const service = new AgentProfileGovernanceService({
      transactionManager: new PrismaTransactionManager(prismaClient(profiles, auditLogs)),
    });

    const created = await service.createDraft({
      slug: "prisma-agent",
      name: "Prisma Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "prisma-agent" }),
    });
    expect(created.profile).toMatchObject({ slug: "prisma-agent", status: "draft" });

    const updated = await service.updateDraft(created.profile.id, {
      name: "Prisma Agent 更新",
      content: createAgentProfileContent({ slug: "prisma-agent", name: "Prisma Agent 更新", riskLevel: "high" }),
    });
    expect(updated.profile).toMatchObject({ name: "Prisma Agent 更新", riskLevel: "high" });

    const published = await service.publish(created.profile.id, { publishNote: "发布" });
    expect(published.profile).toMatchObject({ status: "published", publishedAt: expect.any(String) });
    expect(auditLogs).toEqual([expect.objectContaining({ action: "publish", targetType: "agent-profile" })]);

    const deprecated = await service.deprecate(created.profile.id, { reason: "已有新版本" });
    expect(deprecated.profile.status).toBe("deprecated");

    const archived = await service.archive(created.profile.id, { reason: "归档" });
    expect(archived.profile.status).toBe("archived");
  });

  it("slug + version 重复时应返回 AGENT_PROFILE_VERSION_ALREADY_EXISTS", async () => {
    const service = new AgentProfileGovernanceService({
      transactionManager: new PrismaTransactionManager(prismaClient([
        {
          id: "agent-1",
          slug: "same-agent",
          name: "已有",
          scope: "platform",
          status: "draft",
          version: "1.0.0",
          content: createAgentProfileContent({ slug: "same-agent" }),
          checksum: "sha256:exists",
          createdAt: now,
          updatedAt: now,
        },
      ])),
    });

    await expect(
      service.createDraft({
        slug: "same-agent",
        name: "重复",
        version: "1.0.0",
        content: createAgentProfileContent({ slug: "same-agent" }),
      }),
    ).rejects.toMatchObject({ code: "AGENT_PROFILE_VERSION_ALREADY_EXISTS" });
  });
});
