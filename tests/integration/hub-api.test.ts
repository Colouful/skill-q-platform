import { describe, expect, it } from "vitest";
import { GET as assetContentGET } from "@/app/api/hub/assets/[slug]/content/route";
import { GET as agentProfileGET } from "@/app/api/hub/agent-profiles/[slug]/export/route";
import { POST as installRecordPOST } from "@/app/api/hub/install-records/route";
import { GET as manifestExportGET } from "@/app/api/hub/manifests/[manifestId]/export/route";
import { POST as manifestRecommendPOST } from "@/app/api/hub/manifests/recommend/route";
import { POST as runtimeFeedbackPOST } from "@/app/api/hub/runtime-feedback/route";

async function json(response: Response) {
  return (await response.json()) as Record<string, any>;
}

function postRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Hub API", () => {
  it("Manifest Recommend 返回统一 ApiResponse", async () => {
    const response = await manifestRecommendPOST(
      postRequest("http://localhost/api/hub/manifests/recommend", {
        workspace: {},
        projectFacts: [
          {
            packageId: "app",
            primary: {
              manifestSlug: "frontend-react-nextjs-standard",
              confidence: 92,
              tags: ["nextjs"],
            },
          },
        ],
      }),
    );
    const body = await json(response);

    expect(body.success).toBe(true);
    expect(body.error).toBeNull();
    expect(body.requestId).toBeTruthy();
    expect(body.timestamp).toBeTruthy();
    expect(body.data.recommendations[0].manifest.slug).toBe("frontend-react-nextjs-standard");
  });

  it("Manifest Export 返回 br-ai-spec 可消费结构", async () => {
    const response = await manifestExportGET(
      new Request("http://localhost/api/hub/manifests/frontend-react-nextjs-standard/export?version=1.0.0"),
      { params: Promise.resolve({ manifestId: "frontend-react-nextjs-standard" }) },
    );
    const body = await json(response);

    expect(body.success).toBe(true);
    expect(body.data.schemaVersion).toBe("1.0.0");
    expect(body.data.manifest.checksum).toMatch(/^sha256:/);
    expect(body.data.assets[0].checksum).toMatch(/^sha256:/);
    expect(body.data.assets[0].contentUrl).toContain("/api/hub/assets/");
    expect(body.data.agentProfiles[0].checksum).toMatch(/^sha256:/);
  });

  it("Asset Content 只能读取 published 并返回 checksum", async () => {
    const response = await assetContentGET(
      new Request("http://localhost/api/hub/assets/planner-role/content?version=1.0.0"),
      { params: Promise.resolve({ slug: "planner-role" }) },
    );
    const body = await json(response);

    expect(body.success).toBe(true);
    expect(body.data.slug).toBe("planner-role");
    expect(body.data.checksum).toMatch(/^sha256:/);
    expect(body.data.content).toContain("Planner Role");
  });

  it("Agent Profile Export 成功", async () => {
    const response = await agentProfileGET(
      new Request("http://localhost/api/hub/agent-profiles/diagnostic-agent/export?version=1.0.0"),
      { params: Promise.resolve({ slug: "diagnostic-agent" }) },
    );
    const body = await json(response);

    expect(body.success).toBe(true);
    expect(body.data.content.deniedTools).toContain("upload-source");
    expect(body.data.checksum).toMatch(/^sha256:/);
  });

  it("Install Record 不接收源码", async () => {
    const response = await installRecordPOST(
      postRequest("http://localhost/api/hub/install-records", {
        projectId: "project-1",
        manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
        sourceCode: "secret",
      }),
    );
    const body = await json(response);

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("PRIVACY_VIOLATION");
    expect(body.error.message).toContain("sourceCode");
    expect(body.error.suggestion).toBeTruthy();
  });

  it("Runtime Feedback 不接收 rawPrompt/rawResponse", async () => {
    const response = await runtimeFeedbackPOST(
      postRequest("http://localhost/api/hub/runtime-feedback", {
        projectId: "project-1",
        runId: "run-1",
        manifest: { slug: "frontend-react-nextjs-standard", version: "1.0.0" },
        executor: "cursor",
        result: { status: "succeeded", success: true, durationMs: 10 },
        rawPrompt: "prompt",
      }),
    );
    const body = await json(response);

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("PRIVACY_VIOLATION");
    expect(body.error.message).toContain("rawPrompt");
    expect(body.error.suggestion).toBeTruthy();
  });
});
