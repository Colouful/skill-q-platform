import { describe, expect, it } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { AuditLogService } from "@/server/hub/audit-log-service";
import { ManifestAssetBindingService } from "@/server/hub/manifest-asset-binding-service";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { ReviewWorkflowService } from "@/server/hub/review-workflow-service";
import { createAgentProfileContent } from "../agent-profiles/agent-profile-test-fixtures";
import { createPublishedAsset } from "../manifests/manifest-test-fixtures";

function createAssetVersionFixture() {
  const repo = createHubRepository();
  const assetService = new AssetGovernanceService(repo);
  const versionService = new AssetVersionService(repo);
  const audit = new AuditLogService();
  audit.clear();
  const workflow = new ReviewWorkflowService(repo, audit);
  const asset = assetService.createDraft({ slug: "review-asset", name: "审核资产", kind: "rule", scope: "platform" });
  const version = versionService.create(asset.asset.id, { version: "1.0.0", content: "# Review\n" });
  return { repo, audit, workflow, asset: asset.asset, version: version.version, assetService };
}

function createManifestVersionFixture() {
  const repo = createHubRepository();
  const manifestService = new ManifestGovernanceService(repo);
  const versionService = new ManifestVersionService(repo);
  const bindingService = new ManifestAssetBindingService(repo);
  const audit = new AuditLogService();
  audit.clear();
  const workflow = new ReviewWorkflowService(repo, audit);
  const manifest = manifestService.createDraft({ slug: "review-manifest", name: "审核 Manifest", scope: "platform" });
  const version = versionService.create(manifest.manifest.id, { version: "1.0.0" });
  const asset = createPublishedAsset(repo);
  bindingService.bind(manifest.manifest.id, version.version.id, {
    assetId: asset.asset.id,
    assetVersionId: asset.version.id,
    kind: "role",
    required: true,
  });
  return { repo, audit, workflow, manifest: manifest.manifest, version: version.version, manifestService };
}

function createAgentProfileFixture() {
  const repo = createHubRepository();
  const profileService = new AgentProfileGovernanceService(repo);
  const audit = new AuditLogService();
  audit.clear();
  const workflow = new ReviewWorkflowService(repo, audit);
  const profile = profileService.createDraft({
    slug: "review-agent",
    name: "审核 Agent",
    version: "1.0.0",
    content: createAgentProfileContent({ slug: "review-agent", name: "审核 Agent" }),
  });
  return { repo, audit, workflow, profile: profile.profile };
}

describe("ReviewWorkflowService", () => {
  it("Asset Version draft 可提交审核、reviewing 可驳回、rejected 可重新提交审核", async () => {
    const { audit, workflow, asset, version } = createAssetVersionFixture();

    expect((await workflow.submitAssetVersion(asset.id, version.id, { note: "提交" })).version.status).toBe("reviewing");
    expect((await workflow.rejectAssetVersion(asset.id, version.id, { reason: "内容需要调整" })).version.status).toBe("rejected");
    expect((await workflow.submitAssetVersion(asset.id, version.id, { note: "重新提交" })).version.status).toBe("reviewing");
    expect((await audit.list({ targetId: version.id })).items).toHaveLength(3);
  });

  it("Asset Version reviewing 可发布，published 不可提交审核", async () => {
    const { workflow, asset, version } = createAssetVersionFixture();
    await workflow.submitAssetVersion(asset.id, version.id, {});

    const published = await workflow.publishAssetVersion(asset.id, version.id, {});

    expect(published.version.status).toBe("published");
    await expect(workflow.submitAssetVersion(asset.id, version.id, {})).rejects.toThrow("当前状态不允许提交审核");
  });

  it("archived Asset 不允许提交审核且 published 不允许修改内容", async () => {
    const { workflow, asset, version, assetService } = createAssetVersionFixture();
    assetService.archive(asset.id, { reason: "归档" });

    await expect(workflow.submitAssetVersion(asset.id, version.id, {})).rejects.toThrow("已归档资源不允许进入审核流程");
  });

  it("Manifest Version draft 可提交审核、reviewing 可驳回、reviewing 可发布", async () => {
    const { audit, workflow, manifest, version } = createManifestVersionFixture();

    expect((await workflow.submitManifestVersion(manifest.id, version.id, {})).version.status).toBe("reviewing");
    expect((await workflow.rejectManifestVersion(manifest.id, version.id, { reason: "缺少说明" })).version.status).toBe("rejected");
    await workflow.submitManifestVersion(manifest.id, version.id, {});
    const published = await workflow.publishManifestVersion(manifest.id, version.id, {});

    expect(published.version.status).toBe("published");
    expect((await audit.list({ targetId: version.id })).items.length).toBeGreaterThanOrEqual(4);
  });

  it("Manifest Version 无 required asset 时发布失败", async () => {
    const repo = createHubRepository();
    const manifestService = new ManifestGovernanceService(repo);
    const versionService = new ManifestVersionService(repo);
    const workflow = new ReviewWorkflowService(repo, new AuditLogService());
    const manifest = manifestService.createDraft({ slug: "no-required", name: "无 required", scope: "platform" });
    const version = versionService.create(manifest.manifest.id, { version: "1.0.0" });
    await workflow.submitManifestVersion(manifest.manifest.id, version.version.id, {});

    await expect(workflow.publishManifestVersion(manifest.manifest.id, version.version.id, {})).rejects.toThrow(
      "Manifest 至少需要绑定一个 required asset",
    );
  });

  it("Agent Profile draft 可提交审核、reviewing 可驳回、reviewing 可发布", async () => {
    const { audit, workflow, profile } = createAgentProfileFixture();

    expect((await workflow.submitAgentProfile(profile.id, {})).profile.status).toBe("reviewing");
    expect((await workflow.rejectAgentProfile(profile.id, { reason: "策略说明不足" })).profile.status).toBe("rejected");
    await workflow.submitAgentProfile(profile.id, {});
    const published = await workflow.publishAgentProfile(profile.id, {});

    expect(published.profile.status).toBe("published");
    expect((await audit.list({ targetType: "agent-profile", targetId: profile.id })).items.length).toBeGreaterThanOrEqual(4);
  });

  it("Agent Profile validate 不通过时发布失败", async () => {
    const { repo, workflow, profile } = createAgentProfileFixture();
    await workflow.submitAgentProfile(profile.id, {});
    const stored = repo.agentProfiles.find((item) => item.id === profile.id);
    if (!stored) throw new Error("测试数据缺失");
    stored.content.contextScope.allowSourceCode = true;

    await expect(workflow.publishAgentProfile(profile.id, {})).rejects.toThrow("当前状态不允许发布");
  });

  it("reason 为空时驳回失败", async () => {
    const { workflow, asset, version } = createAssetVersionFixture();
    await workflow.submitAssetVersion(asset.id, version.id, {});

    await expect(workflow.rejectAssetVersion(asset.id, version.id, { reason: "" })).rejects.toThrow("驳回原因不能为空");
  });
});
