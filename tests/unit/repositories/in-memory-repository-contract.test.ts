import { describe, expect, it } from "vitest";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";
import { createHubRepository } from "@/server/hub/repository";

function createSeededAdapter() {
  const repo = createHubRepository();
  const asset = repo.createAsset({
    slug: "repository-planner-role",
    name: "仓储规划角色",
    kind: "role",
    scope: "platform",
    status: "published",
    description: "用于 Repository contract 测试",
    tags: ["repository"],
  });
  const publishedVersion = repo.createAssetVersion({
    assetId: asset.id,
    version: "1.0.0",
    content: "# Role",
    status: "published",
  });
  repo.createAssetVersion({
    assetId: asset.id,
    version: "1.1.0",
    content: "# Draft",
    status: "draft",
  });
  const manifest = repo.createManifest({
    slug: "repository-frontend-standard",
    name: "仓储前端标准",
    scope: "platform",
    status: "published",
    techStacks: ["react"],
    projectKinds: ["web"],
    tags: ["repository"],
  });
  const manifestVersion = repo.createManifestVersion({
    manifestId: manifest.id,
    version: "1.0.0",
    status: "published",
  });
  repo.linkManifestAsset({
    manifestVersionId: manifestVersion.id,
    assetId: asset.id,
    assetVersionId: publishedVersion.id,
    kind: "role",
    required: true,
    order: 1,
  });
  const profile = repo.createAgentProfile({
    slug: "repository-diagnostic-agent",
    name: "仓储诊断智能体",
    version: "1.0.0",
    status: "published",
    content: {
      slug: "repository-diagnostic-agent",
      name: "仓储诊断智能体",
      defaultExecutor: "cursor",
      fallbackExecutors: ["claude-code", "codex"],
      allowedTools: [],
      deniedTools: ["upload-source", "deploy", "push", "merge"],
      contextScope: {
        allowSourceCode: false,
        allowRelativePath: true,
        allowAbsolutePath: false,
      },
      modelPolicy: {
        tokenBudget: 80000,
        reasoningEffort: "high",
      },
      approvalPolicy: {
        beforePush: true,
        beforeMerge: true,
        highRiskAlwaysManual: true,
      },
      outputContract: {
        mustReturn: ["summary"],
      },
      riskLevel: "medium",
    },
  });
  repo.installRecords.push({
    id: "install-1",
    projectId: "project-1",
    workspaceId: "workspace-1",
    manifest: { slug: manifest.slug, version: "1.0.0" },
    packages: [{ slug: asset.slug }],
    manifestSlug: manifest.slug,
    manifestVersion: "1.0.0",
    manifestChecksum: manifestVersion.checksum,
    status: "accepted",
    failureReason: null,
    packageCount: 1,
    clientName: "br-ai-spec",
    clientVersion: "1.1.0",
    installedAt: "2026-04-26T00:00:00.000Z",
    client: { name: "br-ai-spec", version: "1.1.0" },
    createdAt: "2026-04-26T00:00:00.000Z",
  });
  repo.runtimeFeedback.push({
    id: "feedback-1",
    projectId: "project-1",
    runId: "run-1",
    manifest: { slug: manifest.slug, version: "1.0.0" },
    assetsUsed: [{ slug: asset.slug }],
    executor: "cursor",
    result: { status: "success", success: true, durationMs: 1200 },
    issues: [],
    manifestSlug: manifest.slug,
    manifestVersion: "1.0.0",
    success: true,
    durationMs: 1200,
    failureCategory: null,
    executorType: "cursor",
    assetSlugs: [asset.slug],
    privacyChecked: true,
    createdAt: "2026-04-26T00:00:00.000Z",
  });
  return { adapter: new InMemoryHubRepositoryAdapter(repo), asset, publishedVersion, manifest, manifestVersion, profile };
}

describe("InMemoryHubRepositoryAdapter contract", () => {
  it("应支持 Asset 列表、详情和版本查询", async () => {
    const { adapter, asset, publishedVersion } = createSeededAdapter();

    const result = await adapter.listAssets({ keyword: "planner", page: 1, pageSize: 10 });

    expect(result.pagination.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      slug: "repository-planner-role",
      versionCount: 2,
      publishedVersionCount: 1,
    });
    await expect(adapter.findAssetById(asset.id)).resolves.toMatchObject({ slug: asset.slug });
    await expect(adapter.findAssetBySlug(asset.slug)).resolves.toMatchObject({ id: asset.id });
    await expect(adapter.listAssetVersions(asset.id)).resolves.toHaveLength(2);
    await expect(adapter.findAssetVersionById(publishedVersion.id)).resolves.toMatchObject({ checksum: publishedVersion.checksum });
  });

  it("应支持 Manifest 列表、详情、版本和绑定查询", async () => {
    const { adapter, manifest, manifestVersion } = createSeededAdapter();

    const result = await adapter.listManifests({ techStack: "react", page: 1, pageSize: 10 });

    expect(result.pagination.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      slug: "repository-frontend-standard",
      versionCount: 1,
      assetBindingCount: 1,
    });
    await expect(adapter.findManifestById(manifest.id)).resolves.toMatchObject({ slug: manifest.slug });
    await expect(adapter.findManifestBySlug(manifest.slug)).resolves.toMatchObject({ id: manifest.id });
    await expect(adapter.listManifestVersions(manifest.id)).resolves.toHaveLength(1);
    await expect(adapter.findManifestVersionById(manifestVersion.id)).resolves.toMatchObject({ checksum: manifestVersion.checksum });
    await expect(adapter.listManifestAssetBindings(manifestVersion.id)).resolves.toMatchObject([
      { assetSlug: "repository-planner-role", required: true },
    ]);
  });

  it("应支持 Agent Profile、Install Record、Runtime Feedback 和 AuditLog 查询", async () => {
    const { adapter, profile } = createSeededAdapter();

    await expect(adapter.listAgentProfiles({ riskLevel: "medium" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ slug: "repository-diagnostic-agent", defaultExecutor: "cursor" }],
    });
    await expect(adapter.findAgentProfileById(profile.id)).resolves.toMatchObject({ slug: profile.slug });
    await expect(adapter.findAgentProfileBySlugAndVersion(profile.slug, "1.0.0")).resolves.toMatchObject({
      id: profile.id,
    });
    await expect(adapter.listInstallRecords({ manifestSlug: "repository-frontend" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ clientName: "br-ai-spec" }],
    });
    await expect(adapter.listRuntimeFeedback({ success: "true" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ executorType: "cursor", privacyChecked: true }],
    });

    const log = await adapter.createAuditLog({
      targetType: "asset-version",
      targetId: "version-1",
      action: "submit-review",
      operatorId: "system",
      operatorName: "系统",
      statusFrom: "draft",
      statusTo: "reviewing",
    });

    expect(log.id).toBeTruthy();
    await expect(adapter.listAuditLogs({ targetType: "asset-version" })).resolves.toMatchObject({
      pagination: { total: 1 },
      items: [{ action: "submit-review" }],
    });
  });
});
