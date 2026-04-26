import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AgentProfileDetailPage, AssetDetailPage, ManifestDetailPage } from "@/components/hub/hub-admin-pages";

vi.mock("@/lib/hub-admin-client", () => {
  const draftVersion = {
    id: "asset-version-draft",
    version: "1.0.0",
    status: "draft",
    immutable: false,
    checksum: "sha256:asset",
    contentFormat: "markdown",
    contentSize: 12,
    qualityScore: 90,
  };
  const reviewingManifestVersion = {
    id: "manifest-version-reviewing",
    version: "1.0.0",
    status: "reviewing",
    checksum: "sha256:manifest",
    assetBindingCount: 1,
    installPolicy: { defaultExecutor: "cursor", fallbackExecutors: ["claude-code", "codex"] },
  };
  const reviewingProfile = {
    id: "profile-reviewing",
    slug: "review-agent",
    name: "审核 Agent",
    version: "1.0.0",
    status: "reviewing",
    riskLevel: "medium",
    defaultExecutor: "cursor",
    deniedTools: ["upload-source", "deploy", "push", "merge"],
    checksum: "sha256:profile",
    content: {
      deniedTools: ["upload-source", "deploy", "push", "merge"],
      contextScope: { allowSourceCode: false, allowAbsolutePath: false },
      approvalPolicy: { beforePush: true, beforeMerge: true, highRiskAlwaysManual: true },
    },
  };
  return {
    getAssetDetail: vi.fn(async () => ({
      asset: { id: "asset-1", slug: "review-asset", name: "审核资产", kind: "rule", scope: "platform", status: "draft" },
      versions: [draftVersion],
      manifestRefs: [],
    })),
    getManifestDetail: vi.fn(async () => ({
      manifest: { id: "manifest-1", slug: "review-manifest", name: "审核 Manifest", scope: "platform", status: "reviewing" },
      versions: [reviewingManifestVersion],
      assetBindings: [],
    })),
    getAgentProfileDetail: vi.fn(async () => ({ profile: reviewingProfile })),
    createAssetVersion: vi.fn(),
    publishAssetVersion: vi.fn(),
    submitAssetVersionReview: vi.fn(),
    rejectAssetVersion: vi.fn(),
    deprecateAssetVersion: vi.fn(),
    createManifestVersion: vi.fn(),
    bindManifestAsset: vi.fn(),
    unbindManifestAsset: vi.fn(),
    reorderManifestAssets: vi.fn(),
    publishManifestVersion: vi.fn(),
    submitManifestVersionReview: vi.fn(),
    rejectManifestVersion: vi.fn(),
    deprecateManifestVersion: vi.fn(),
    publishAgentProfile: vi.fn(),
    submitAgentProfileReview: vi.fn(),
    rejectAgentProfile: vi.fn(),
    validateAgentProfile: vi.fn(async () => ({ valid: true, errors: [], warnings: [] })),
  };
});

describe("Hub review pages", () => {
  it("Asset 详情页应显示提交审核按钮", async () => {
    render(<AssetDetailPage assetId="asset-1" />);

    expect(await screen.findByText("提交审核")).toBeTruthy();
  });

  it("Manifest 详情页应显示驳回按钮和发布前检查入口", async () => {
    render(<ManifestDetailPage manifestId="manifest-1" />);

    expect(await screen.findByText("审核通过发布")).toBeTruthy();
    expect(await screen.findByText("驳回")).toBeTruthy();
  });

  it("Agent Profile 详情页应显示发布前检查结果", async () => {
    render(<AgentProfileDetailPage profileId="profile-reviewing" />);

    expect(await screen.findByText("发布前检查结果")).toBeTruthy();
    expect(document.body.textContent).not.toContain("sourceCode");
    expect(document.body.textContent).not.toContain("rawPrompt");
    expect(document.body.textContent).not.toContain("rawResponse");
    expect(document.body.textContent).not.toContain("/Users/");
  });
});
