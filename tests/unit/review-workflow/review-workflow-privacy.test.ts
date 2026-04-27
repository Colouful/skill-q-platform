import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { ReviewWorkflowService } from "@/server/hub/review-workflow-service";

function createFixture() {
  const repo = createHubRepository();
  const asset = new AssetGovernanceService(repo).createDraft({
    slug: "privacy-review-asset",
    name: "隐私审核资产",
    kind: "rule",
    scope: "platform",
  }).asset;
  const version = new AssetVersionService(repo).create(asset.id, { version: "1.0.0", content: "# Privacy\n" }).version;
  return { workflow: new ReviewWorkflowService(repo), asset, version };
}

describe("ReviewWorkflow privacy", () => {
  it("note 包含 sourceCode 时拒绝提交审核", async () => {
    const { workflow, asset, version } = createFixture();

    await expect(workflow.submitAssetVersion(asset.id, version.id, { note: "sourceCode: const a = 1" })).rejects.toMatchObject({
      code: "AUDIT_LOG_PRIVACY_VIOLATED",
    });
  });

  it("reason 包含 rawPrompt 时拒绝驳回", async () => {
    const { workflow, asset, version } = createFixture();
    await workflow.submitAssetVersion(asset.id, version.id, {});

    await expect(workflow.rejectAssetVersion(asset.id, version.id, { reason: "rawPrompt 泄露" })).rejects.toMatchObject({
      code: "AUDIT_LOG_PRIVACY_VIOLATED",
    });
  });

  it("metadata 包含 /Users/ 或嵌套 token 时拒绝", async () => {
    const workflow = new ReviewWorkflowService();

    await expect(workflow.submitReview("asset-version", { metadata: { path: "/Users/lizhenwei/project" } })).rejects.toMatchObject({
      code: "PRIVACY_VIOLATION",
    });
    await expect(workflow.submitReview("asset-version", { metadata: { nested: { token: "secret-token" } } })).rejects.toMatchObject({
      code: "AUDIT_LOG_PRIVACY_VIOLATED",
    });
  });

  it("非法 targetType 返回中文错误", async () => {
    await expect(new ReviewWorkflowService().submitReview("unknown", {})).rejects.toMatchObject({
      code: "INVALID_REVIEW_TARGET_TYPE",
      message: "审核目标类型不合法",
    });
  });
});
