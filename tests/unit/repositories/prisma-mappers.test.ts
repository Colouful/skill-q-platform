import { describe, expect, it } from "vitest";
import {
  mapPrismaAgentProfileSummary,
  mapPrismaAssetSummary,
  mapPrismaInstallRecordSummary,
  mapPrismaManifestSummary,
  mapPrismaRuntimeFeedbackSummary,
  sanitizeJson,
} from "@/server/hub/repositories/prisma/prisma-mappers";

const now = new Date("2026-04-26T00:00:00.000Z");

describe("prisma-mappers", () => {
  it("mapper 应移除 sourceCode / rawPrompt / rawResponse / 绝对路径", () => {
    const result = sanitizeJson({
      sourceCode: "const a = 1",
      rawPrompt: "prompt",
      rawResponse: "response",
      nested: {
        path: "/Users/lizhenwei/private/project",
        token: "secret-token",
      },
    });
    const text = JSON.stringify(result);

    expect(text).not.toContain("sourceCode");
    expect(text).not.toContain("rawPrompt");
    expect(text).not.toContain("rawResponse");
    expect(text).not.toContain("/Users/");
    expect(text).not.toContain("secret-token");
    expect(text).toContain("已移除敏感内容");
  });

  it("Asset 列表结构应兼容 V2.1", () => {
    const asset = mapPrismaAssetSummary({
      id: "asset-1",
      slug: "planner-role",
      name: "规划角色",
      kind: "role",
      scope: "platform",
      status: "published",
      description: "demo",
      tags: ["planner"],
      versions: [{ status: "published" }, { status: "draft" }],
      createdAt: now,
      updatedAt: now,
    });

    expect(asset).toMatchObject({
      id: "asset-1",
      slug: "planner-role",
      name: "规划角色",
      kind: "role",
      scope: "platform",
      status: "published",
      versionCount: 2,
      publishedVersionCount: 1,
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z",
    });
  });

  it("Manifest 列表结构应兼容 V2.1", () => {
    const manifest = mapPrismaManifestSummary({
      id: "manifest-1",
      slug: "frontend-standard",
      name: "前端标准",
      scope: "platform",
      status: "published",
      tags: ["frontend"],
      techStacks: ["react"],
      projectKinds: ["web"],
      recommendedFor: ["standard"],
      versions: [{ status: "published", assets: [{ id: "binding-1" }] }],
      createdAt: now,
      updatedAt: now,
    });

    expect(manifest).toMatchObject({
      slug: "frontend-standard",
      versionCount: 1,
      publishedVersionCount: 1,
      assetBindingCount: 1,
      techStacks: ["react"],
      projectKinds: ["web"],
    });
  });

  it("Agent Profile 列表结构应兼容 V2.1 且不泄露敏感字段", () => {
    const profile = mapPrismaAgentProfileSummary({
      id: "profile-1",
      slug: "diagnostic-agent",
      name: "诊断智能体",
      version: "1.0.0",
      scope: "platform",
      status: "published",
      content: {
        defaultExecutor: "cursor",
        deniedTools: ["upload-source", "deploy", "push", "merge"],
        sourceCode: "secret",
      },
      checksum: "checksum",
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    });

    expect(profile).toMatchObject({
      slug: "diagnostic-agent",
      version: "1.0.0",
      status: "published",
      defaultExecutor: "cursor",
      deniedTools: ["upload-source", "deploy", "push", "merge"],
      checksum: "checksum",
    });
    expect(JSON.stringify(profile)).not.toContain("sourceCode");
  });

  it("Install Record 列表结构应兼容 V2.1", () => {
    const record = mapPrismaInstallRecordSummary({
      id: "install-1",
      projectId: "project-1",
      workspaceId: "workspace-1",
      manifest: { slug: "frontend-standard", version: "1.0.0" },
      packages: [{ slug: "asset-a" }],
      status: "accepted",
      client: { name: "br-ai-spec", version: "1.1.0" },
      installedAt: now,
      createdAt: now,
    });

    expect(record).toMatchObject({
      manifestSlug: "frontend-standard",
      manifestVersion: "1.0.0",
      packageCount: 1,
      clientName: "br-ai-spec",
      clientVersion: "1.1.0",
    });
  });

  it("Runtime Feedback 列表结构应兼容 V2.1", () => {
    const feedback = mapPrismaRuntimeFeedbackSummary({
      id: "feedback-1",
      projectId: "project-1",
      runId: "run-1",
      manifest: { slug: "frontend-standard", version: "1.0.0" },
      result: { success: true, durationMs: 1200 },
      executor: "cursor",
      assetSlugs: ["planner-role"],
      privacyChecked: true,
      createdAt: now,
    });

    expect(feedback).toMatchObject({
      manifestSlug: "frontend-standard",
      manifestVersion: "1.0.0",
      success: true,
      durationMs: 1200,
      executorType: "cursor",
      privacyChecked: true,
    });
  });
});
