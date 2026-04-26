import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AgentProfileDetailPage,
  AgentProfileListPage,
  AssetDetailPage,
  AssetListPage,
  HubHomePage,
  InstallRecordsPage,
  ManifestDetailPage,
  ManifestListPage,
  RuntimeFeedbackPage,
} from "@/components/hub/hub-admin-pages";

vi.mock("@/lib/hub-admin-client", () => {
  const listResult = (items: Array<Record<string, unknown>>) => ({ items, pagination: { page: 1, pageSize: 20, total: items.length } });
  const asset = { id: "asset-1", slug: "planner-role", name: "Planner", kind: "role", scope: "platform", status: "published", versionCount: 1, publishedVersionCount: 1, updatedAt: "2026-04-26" };
  const manifest = { id: "manifest-1", slug: "frontend-react-nextjs-standard", name: "Next", scope: "platform", status: "published", versionCount: 1, publishedVersionCount: 1, assetBindingCount: 1, updatedAt: "2026-04-26" };
  const profile = { id: "profile-1", slug: "diagnostic-agent", name: "Diagnostic", version: "1.0.0", status: "published", riskLevel: "medium", defaultExecutor: "cursor", deniedTools: ["upload-source", "push", "merge", "deploy"], checksum: "sha256:abc", updatedAt: "2026-04-26" };
  return {
    listAssets: vi.fn(async () => listResult([asset])),
    listManifests: vi.fn(async () => listResult([manifest])),
    listAgentProfiles: vi.fn(async () => listResult([profile])),
    listInstallRecords: vi.fn(async () => listResult([{ id: "install-1", projectId: "p1", manifestSlug: "frontend-react-nextjs-standard", status: "accepted" }])),
    listRuntimeFeedback: vi.fn(async () => listResult([{ id: "run-1", projectId: "p1", runId: "r1", manifestSlug: "frontend-react-nextjs-standard", success: true, privacyChecked: true }])),
    getAssetDetail: vi.fn(async () => ({ asset, versions: [{ id: "av1", version: "1.0.0", status: "published", immutable: true, checksum: "sha256:a", contentFormat: "markdown", contentSize: 10, qualityScore: 0 }], manifestRefs: [] })),
    getManifestDetail: vi.fn(async () => ({ manifest, versions: [{ id: "mv1", version: "1.0.0", status: "published", checksum: "sha256:m", assetBindingCount: 1, installPolicy: { defaultExecutor: "cursor", fallbackExecutors: ["claude-code", "codex"] } }], assetBindings: [{ bindingId: "b1", manifestVersionId: "mv1", order: 1, assetSlug: "planner-role", assetName: "Planner", assetVersion: "1.0.0", kind: "role", checksum: "sha256:a", required: true, loadWhen: ["planning"] }] })),
    getAgentProfileDetail: vi.fn(async () => ({ profile: { ...profile, content: { deniedTools: profile.deniedTools, contextScope: { allowSourceCode: false, allowAbsolutePath: false }, approvalPolicy: { beforePush: true, beforeMerge: true, highRiskAlwaysManual: true } } } })),
    createAsset: vi.fn(), createAssetVersion: vi.fn(), publishAssetVersion: vi.fn(), submitAssetVersionReview: vi.fn(), rejectAssetVersion: vi.fn(), deprecateAssetVersion: vi.fn(), archiveAsset: vi.fn(),
    createManifest: vi.fn(), createManifestVersion: vi.fn(), bindManifestAsset: vi.fn(), unbindManifestAsset: vi.fn(), reorderManifestAssets: vi.fn(), publishManifestVersion: vi.fn(), submitManifestVersionReview: vi.fn(), rejectManifestVersion: vi.fn(), deprecateManifestVersion: vi.fn(), archiveManifest: vi.fn(),
    createAgentProfile: vi.fn(), updateAgentProfile: vi.fn(), publishAgentProfile: vi.fn(), submitAgentProfileReview: vi.fn(), rejectAgentProfile: vi.fn(), deprecateAgentProfile: vi.fn(), archiveAgentProfile: vi.fn(), validateAgentProfile: vi.fn(async () => ({ valid: true, errors: [], warnings: [] })),
    listAuditLogs: vi.fn(async () => listResult([])),
  };
});

describe("Hub pages", () => {
  it("Hub 首页可渲染", async () => {
    render(<HubHomePage />);
    await screen.findAllByText("Hub 资产治理");
    await waitFor(() => expect(screen.getByText("Asset 总数")).toBeTruthy());
  });

  it("Asset 列表页面可渲染", async () => {
    render(<AssetListPage />);
    expect(await screen.findByText("Asset 资产管理")).toBeTruthy();
    expect(await screen.findByText("planner-role")).toBeTruthy();
  });

  it("Asset 详情页面可渲染", async () => {
    render(<AssetDetailPage assetId="asset-1" />);
    expect(await screen.findByText(/Asset 详情/)).toBeTruthy();
    expect(await screen.findByText("Asset Version 管理区")).toBeTruthy();
  });

  it("Manifest 列表页面可渲染", async () => {
    render(<ManifestListPage />);
    expect(await screen.findByText("Manifest 管理")).toBeTruthy();
    expect(await screen.findByText("frontend-react-nextjs-standard")).toBeTruthy();
  });

  it("Manifest 详情页面可渲染", async () => {
    render(<ManifestDetailPage manifestId="manifest-1" />);
    expect(await screen.findByText(/Manifest 详情/)).toBeTruthy();
    expect(await screen.findByText("Asset 绑定操作区")).toBeTruthy();
  });

  it("Agent Profile 列表页面可渲染", async () => {
    render(<AgentProfileListPage />);
    expect(await screen.findByText("Agent Profile 管理")).toBeTruthy();
    expect(await screen.findByText("diagnostic-agent")).toBeTruthy();
  });

  it("Agent Profile 详情页面可渲染", async () => {
    render(<AgentProfileDetailPage profileId="profile-1" />);
    expect(await screen.findByText(/Agent Profile 详情/)).toBeTruthy();
    expect(await screen.findByText("禁止上传源码")).toBeTruthy();
  });

  it("Install Record 页面可渲染", async () => {
    render(<InstallRecordsPage />);
    expect(await screen.findByText("Install Record 安装记录")).toBeTruthy();
    expect(await screen.findByText("p1")).toBeTruthy();
  });

  it("Runtime Feedback 页面可渲染且不展示敏感字段", async () => {
    render(<RuntimeFeedbackPage />);
    expect(await screen.findByText("Runtime Feedback 运行反馈")).toBeTruthy();
    expect(document.body.textContent).not.toContain("sourceCode");
    expect(document.body.textContent).not.toContain("rawPrompt");
    expect(document.body.textContent).not.toContain("rawResponse");
    expect(document.body.textContent).not.toContain("/Users/");
  });
});
