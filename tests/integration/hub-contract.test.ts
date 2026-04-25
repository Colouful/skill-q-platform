import { describe, expect, it } from "vitest";
import { GET as assetContentGET } from "@/app/api/hub/assets/[slug]/content/route";
import { GET as agentProfileGET } from "@/app/api/hub/agent-profiles/[slug]/export/route";
import { POST as installRecordPOST } from "@/app/api/hub/install-records/route";
import { GET as manifestExportGET } from "@/app/api/hub/manifests/[manifestId]/export/route";
import { POST as manifestRecommendPOST } from "@/app/api/hub/manifests/recommend/route";
import { POST as runtimeFeedbackPOST } from "@/app/api/hub/runtime-feedback/route";

async function readBody(response: Response) {
  return (await response.json()) as Record<string, any>;
}

function postJson(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function expectApiResponse(body: Record<string, any>, success: boolean) {
  expect(body.success).toBe(success);
  expect(body.requestId).toBeTruthy();
  expect(body.timestamp).toBeTruthy();
  if (success) {
    expect(body.data).toBeTruthy();
    expect(body.error).toBeNull();
  } else {
    expect(body.data).toBeNull();
    expect(body.error.code).toBeTruthy();
    expect(body.error.message).toBeTruthy();
    expect(body.error.suggestion).toBeTruthy();
  }
}

describe("Hub API br-ai-spec contract", () => {
  it("Manifest Recommend 返回 br-ai-spec 可消费 recommendations 结构", async () => {
    const response = await manifestRecommendPOST(
      postJson("http://localhost/api/hub/manifests/recommend", {
        workspace: { rootDir: ".", type: "single-project" },
        projectFacts: [
          {
            packageId: "web",
            path: ".",
            projectKind: "application",
            primary: {
              domain: "frontend",
              language: ["javascript"],
              frameworks: ["nextjs"],
              confidence: 91,
              manifestSlug: "frontend-react-nextjs-standard",
              tags: ["frontend", "nextjs"],
            },
            candidates: [],
          },
        ],
      }),
    );
    const body = await readBody(response);

    expectApiResponse(body, true);
    expect(Array.isArray(body.data.recommendations)).toBe(true);
    expect(body.data.recommendations[0]).toMatchObject({
      packageId: "web",
      manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
      requiresConfirmation: false,
    });
    expect(body.data.recommendations[0].score).toBeGreaterThanOrEqual(80);
    expect(Array.isArray(body.data.recommendations[0].reasons)).toBe(true);
  });

  it("Manifest Export 返回 assets 和 agentProfiles 缓存索引字段", async () => {
    const response = await manifestExportGET(
      new Request("http://localhost/api/hub/manifests/frontend-react-nextjs-standard/export?version=1.0.0"),
      { params: Promise.resolve({ manifestId: "frontend-react-nextjs-standard" }) },
    );
    const body = await readBody(response);

    expectApiResponse(body, true);
    expect(body.data.schemaVersion).toBe("1.0.0");
    expect(body.data.hub.name).toBe("skill-q-platform");
    expect(body.data.manifest.slug).toBe("frontend-react-nextjs-standard");
    expect(body.data.manifest.version).toBe("1.0.0");
    expect(body.data.manifest.checksum).toMatch(/^sha256:/);
    expect(body.data.manifest.installPolicy.defaultExecutor).toBeTruthy();
    expect(Array.isArray(body.data.assets)).toBe(true);
    expect(body.data.assets[0]).toEqual(
      expect.objectContaining({
        kind: expect.any(String),
        slug: expect.any(String),
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        required: expect.any(Boolean),
        contentUrl: expect.stringContaining("/api/hub/assets/"),
      }),
    );
    expect(Array.isArray(body.data.agentProfiles)).toBe(true);
    expect(body.data.agentProfiles[0]).toEqual(
      expect.objectContaining({
        slug: "diagnostic-agent",
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        contentUrl: expect.stringContaining("/api/hub/agent-profiles/"),
      }),
    );
  });

  it("Asset Content 返回 content 和 checksum", async () => {
    const response = await assetContentGET(
      new Request("http://localhost/api/hub/assets/planner-role/content?version=1.0.0"),
      { params: Promise.resolve({ slug: "planner-role" }) },
    );
    const body = await readBody(response);

    expectApiResponse(body, true);
    expect(body.data).toEqual(
      expect.objectContaining({
        slug: "planner-role",
        version: "1.0.0",
        kind: "role",
        contentFormat: "markdown",
        content: expect.any(String),
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
  });

  it("Agent Profile Export 返回 JSON content 和 checksum", async () => {
    const response = await agentProfileGET(
      new Request("http://localhost/api/hub/agent-profiles/diagnostic-agent/export?version=1.0.0"),
      { params: Promise.resolve({ slug: "diagnostic-agent" }) },
    );
    const body = await readBody(response);

    expectApiResponse(body, true);
    expect(body.data.slug).toBe("diagnostic-agent");
    expect(body.data.version).toBe("1.0.0");
    expect(body.data.checksum).toMatch(/^sha256:/);
    expect(body.data.content.defaultExecutor).toBeTruthy();
    expect(body.data.content.deniedTools).toEqual(expect.arrayContaining(["upload-source", "push", "merge"]));
  });

  it("Install Record 接收 br-ai-spec 安装上报 payload", async () => {
    const response = await installRecordPOST(
      postJson("http://localhost/api/hub/install-records", {
        projectId: "project_1",
        workspaceId: "workspace_1",
        manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
        packages: [{ packageId: "root", path: "." }],
        installedAt: new Date().toISOString(),
        client: { name: "br-ai-spec", version: "0.0.0" },
      }),
    );
    const body = await readBody(response);

    expectApiResponse(body, true);
    expect(body.data.accepted).toBe(true);
  });

  it("Runtime Feedback 接收 br-ai-spec 运行反馈 payload", async () => {
    const response = await runtimeFeedbackPOST(
      postJson("http://localhost/api/hub/runtime-feedback", {
        projectId: "project_1",
        runId: "run_1",
        manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
        assetsUsed: [{ slug: "planner-role", version: "1.0.0" }],
        executor: "codex",
        result: { status: "succeeded", success: true, durationMs: 12 },
        issues: [{ code: "NONE", message: "无" }],
      }),
    );
    const body = await readBody(response);

    expectApiResponse(body, true);
    expect(body.data.accepted).toBe(true);
  });

  it("隐私违规 payload 被拒绝且错误结构稳定", async () => {
    const response = await runtimeFeedbackPOST(
      postJson("http://localhost/api/hub/runtime-feedback", {
        projectId: "project_1",
        runId: "run_1",
        manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
        executor: "codex",
        result: { status: "failed", success: false, durationMs: 12 },
        rawResponse: "不允许上传原始响应",
      }),
    );
    const body = await readBody(response);

    expect(response.status).toBe(400);
    expectApiResponse(body, false);
    expect(body.error.code).toBe("PRIVACY_VIOLATION");
    expect(body.error.message).toContain("rawResponse");
  });
});
