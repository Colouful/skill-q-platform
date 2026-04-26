import { describe, expect, it } from "vitest";
import { GET as assetContentGET } from "@/app/api/hub/assets/[slug]/content/route";
import { GET as agentProfileGET } from "@/app/api/hub/agent-profiles/[slug]/export/route";
import { POST as installRecordPOST } from "@/app/api/hub/install-records/route";
import { GET as manifestExportGET } from "@/app/api/hub/manifests/[manifestId]/export/route";
import { POST as manifestRecommendPOST } from "@/app/api/hub/manifests/recommend/route";
import { POST as runtimeFeedbackPOST } from "@/app/api/hub/runtime-feedback/route";

type HubApiBody = {
  success: boolean;
  data: Record<string, unknown> | null;
  error: null | {
    code: string;
    message: string;
    suggestion: string;
  };
  requestId: string;
  timestamp: string;
};

async function readJson(response: Response) {
  return (await response.json()) as HubApiBody;
}

function postJson(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function expectApiResponseShape(body: HubApiBody, success: boolean) {
  expect(Object.keys(body).sort()).toEqual(["data", "error", "requestId", "success", "timestamp"]);
  expect(body.success).toBe(success);
  expect(body.requestId).toEqual(expect.any(String));
  expect(body.timestamp).toEqual(expect.any(String));
  if (success) {
    expect(body.error).toBeNull();
    expect(body.data).toBeTruthy();
  } else {
    expect(body.data).toBeNull();
    expect(Object.keys(body.error ?? {}).sort()).toEqual(["code", "message", "suggestion"]);
  }
}

describe("br-ai-spec Hub 契约兼容", () => {
  it("Manifest Recommend 应保持 br-ai-spec 可消费响应结构", async () => {
    const response = await manifestRecommendPOST(
      postJson("http://localhost/api/hub/manifests/recommend", {
        workspace: { type: "single-project" },
        projectFacts: [
          {
            packageId: "root",
            projectKind: "application",
            primary: {
              confidence: 91,
              frameworks: ["Vue", "Vite"],
              language: ["TypeScript"],
            },
          },
        ],
      }),
    );
    const body = await readJson(response);
    const recommendations = body.data?.recommendations as Array<Record<string, unknown>>;

    expectApiResponseShape(body, true);
    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        packageId: "root",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        score: 91,
        requiresConfirmation: false,
      }),
    );
    expect(recommendations[0].reasons).toEqual(expect.any(Array));
  });

  it("Manifest Export 应继续包含 assets 和 agentProfiles", async () => {
    const response = await manifestExportGET(
      new Request("http://localhost/api/hub/manifests/frontend-vue-vite-standard/export?version=1.0.0"),
      { params: Promise.resolve({ manifestId: "frontend-vue-vite-standard" }) },
    );
    const body = await readJson(response);
    const manifest = body.data?.manifest as Record<string, unknown>;
    const assets = body.data?.assets as Array<Record<string, unknown>>;
    const agentProfiles = body.data?.agentProfiles as Array<Record<string, unknown>>;

    expectApiResponseShape(body, true);
    expect(body.data?.schemaVersion).toBe("1.0.0");
    expect(manifest).toEqual(
      expect.objectContaining({
        slug: "frontend-vue-vite-standard",
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        installPolicy: expect.objectContaining({
          defaultExecutor: expect.any(String),
          fallbackExecutors: expect.any(Array),
        }),
      }),
    );
    expect(assets[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        contentUrl: expect.stringContaining("/api/hub/assets/"),
      }),
    );
    expect(agentProfiles[0]).toEqual(
      expect.objectContaining({
        slug: "diagnostic-agent",
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        contentUrl: expect.stringContaining("/api/hub/agent-profiles/"),
      }),
    );
  });

  it("Asset Content 和 Agent Profile Export 应继续返回 content 与 checksum", async () => {
    const assetResponse = await assetContentGET(
      new Request("http://localhost/api/hub/assets/planner-role/content?version=1.0.0"),
      { params: Promise.resolve({ slug: "planner-role" }) },
    );
    const profileResponse = await agentProfileGET(
      new Request("http://localhost/api/hub/agent-profiles/diagnostic-agent/export?version=1.0.0"),
      { params: Promise.resolve({ slug: "diagnostic-agent" }) },
    );
    const assetBody = await readJson(assetResponse);
    const profileBody = await readJson(profileResponse);
    const assetData = assetBody.data as Record<string, unknown>;
    const profileData = profileBody.data as Record<string, unknown>;
    const profileContent = profileData.content as Record<string, unknown>;

    expectApiResponseShape(assetBody, true);
    expect(assetData.content).toEqual(expect.any(String));
    expect(assetData.checksum).toMatch(/^sha256:/);

    expectApiResponseShape(profileBody, true);
    expect(profileContent.defaultExecutor).toEqual(expect.any(String));
    expect(profileData.checksum).toMatch(/^sha256:/);
  });

  it("Install Record 与 Runtime Feedback 应继续接收 br-ai-spec payload", async () => {
    const installResponse = await installRecordPOST(
      postJson("http://localhost/api/hub/install-records", {
        projectId: "project-p0",
        workspaceId: "workspace-p0",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0", checksum: "sha256:test" },
        packages: [{ packageId: "root", path: "." }],
        installedAt: new Date().toISOString(),
        client: { name: "br-ai-spec", version: "1.1.0" },
      }),
    );
    const feedbackResponse = await runtimeFeedbackPOST(
      postJson("http://localhost/api/hub/runtime-feedback", {
        projectId: "project-p0",
        runId: "run-p0",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        assetsUsed: [{ slug: "planner-role", version: "1.0.0" }],
        executor: "codex",
        result: { status: "succeeded", success: true, durationMs: 20 },
        issues: [],
      }),
    );
    const installBody = await readJson(installResponse);
    const feedbackBody = await readJson(feedbackResponse);
    const installData = installBody.data as Record<string, unknown>;
    const feedbackData = feedbackBody.data as Record<string, unknown>;

    expectApiResponseShape(installBody, true);
    expect(installData.accepted).toBe(true);
    expect(installData.manifestSlug).toBe("frontend-vue-vite-standard");
    expect(installData.clientName).toBe("br-ai-spec");

    expectApiResponseShape(feedbackBody, true);
    expect(feedbackData.accepted).toBe(true);
    expect(feedbackData.privacyChecked).toBe(true);
    expect(feedbackData.assetSlugs).toEqual(["planner-role"]);
  });
});
