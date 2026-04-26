import { describe, expect, it } from "vitest";
import { POST as archivePOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/archive/route";
import { POST as publishPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/publish/route";
import { GET as detailGET, PATCH as detailPATCH } from "@/app/api/hub/admin/agent-profiles/[profileId]/route";
import { POST as createPOST } from "@/app/api/hub/admin/agent-profiles/route";
import { createAgentProfileContent } from "../unit/agent-profiles/agent-profile-test-fixtures";

type ApiBody = {
  success: boolean;
  data: Record<string, unknown> | null;
  error: null | { code: string; message: string; suggestion: string };
};

async function readJson(response: Response) {
  return (await response.json()) as ApiBody;
}

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function profileParams(profileId: string) {
  return { params: Promise.resolve({ profileId }) };
}

describe("Agent Profile 写事务 API", () => {
  it("应保持创建、更新、发布、归档 API 响应结构兼容", async () => {
    const slug = `agent-write-api-${Date.now()}`;
    const createBody = await readJson(
      await createPOST(jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
        slug,
        name: "Agent Profile 写事务 API",
        version: "1.0.0",
        content: createAgentProfileContent({ slug }),
      })),
    );
    expect(createBody.success).toBe(true);
    const profile = createBody.data?.profile as Record<string, unknown>;
    const profileId = String(profile.id);
    expect(profile).toMatchObject({ slug, status: "draft" });
    expect(JSON.stringify(profile)).not.toContain("sourceCode");

    const patchBody = await readJson(
      await detailPATCH(
        jsonRequest(
          `http://localhost/api/hub/admin/agent-profiles/${profileId}`,
          { content: createAgentProfileContent({ slug, name: "Agent Profile 更新", riskLevel: "high" }) },
          "PATCH",
        ),
        profileParams(profileId),
      ),
    );
    expect(patchBody.success).toBe(true);
    expect((patchBody.data?.profile as Record<string, unknown>).riskLevel).toBe("high");

    const publishBody = await readJson(
      await publishPOST(jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}/publish`, { publishNote: "发布" }), profileParams(profileId)),
    );
    expect(publishBody.success).toBe(true);
    expect((publishBody.data?.profile as Record<string, unknown>).status).toBe("published");

    const publishedPatch = await readJson(
      await detailPATCH(
        jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}`, { content: createAgentProfileContent({ slug }) }, "PATCH"),
        profileParams(profileId),
      ),
    );
    expect(publishedPatch.success).toBe(false);
    expect(publishedPatch.error?.code).toBe("AGENT_PROFILE_UPDATE_NOT_ALLOWED");

    const detailBody = await readJson(
      await detailGET(new Request(`http://localhost/api/hub/admin/agent-profiles/${profileId}`), profileParams(profileId)),
    );
    expect(detailBody.success).toBe(true);

    const archiveBody = await readJson(
      await archivePOST(jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}/archive`, { reason: "归档" }), profileParams(profileId)),
    );
    expect(archiveBody.success).toBe(true);
    expect((archiveBody.data?.profile as Record<string, unknown>).status).toBe("archived");
  });
});
