import { describe, expect, it } from "vitest";
import { POST as archivePOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/archive/route";
import { POST as deprecatePOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/deprecate/route";
import { POST as publishPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/publish/route";
import { GET as detailGET, PATCH as detailPATCH } from "@/app/api/hub/admin/agent-profiles/[profileId]/route";
import { POST as validatePOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/validate/route";
import { GET as listGET, POST as listPOST } from "@/app/api/hub/admin/agent-profiles/route";
import { GET as exportGET } from "@/app/api/hub/agent-profiles/[slug]/export/route";
import { defaultHubRepository } from "@/server/hub";
import { createAgentProfileContent } from "../unit/agent-profiles/agent-profile-test-fixtures";

type ApiBody = {
  success: boolean;
  data: Record<string, unknown> | null;
  error: null | { code: string; message: string; suggestion: string };
  requestId: string;
  timestamp: string;
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

function expectApiShape(body: ApiBody, success: boolean) {
  expect(Object.keys(body).sort()).toEqual(["data", "error", "requestId", "success", "timestamp"]);
  expect(body.success).toBe(success);
  if (success) {
    expect(body.error).toBeNull();
  } else {
    expect(body.data).toBeNull();
    expect(Object.keys(body.error ?? {}).sort()).toEqual(["code", "message", "suggestion"]);
  }
}

function profileParams(profileId: string) {
  return { params: Promise.resolve({ profileId }) };
}

function exportParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe("Agent Profile Admin API", () => {
  it("应完成创建、列表、详情、更新、校验、发布、废弃和归档流程", async () => {
    const slug = `api-agent-${Date.now()}`;
    const createBody = await readJson(
      await listPOST(
        jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
          slug,
          name: "API Agent",
          version: "1.0.0",
          content: createAgentProfileContent({ slug, name: "API Agent", deniedTools: [] }),
          ownerTeamId: "team-api",
        }),
      ),
    );
    expectApiShape(createBody, true);
    const profile = (createBody.data?.profile ?? {}) as Record<string, unknown>;
    const profileId = String(profile.id);
    expect(profile).toEqual(
      expect.objectContaining({
        slug,
        status: "draft",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(((profile.content as Record<string, unknown>).deniedTools as string[])).toEqual(["upload-source", "deploy", "push", "merge"]);

    const draftExportBody = await readJson(
      await exportGET(new Request(`http://localhost/api/hub/agent-profiles/${slug}/export?version=1.0.0`), exportParams(slug)),
    );
    expectApiShape(draftExportBody, false);
    expect(draftExportBody.error?.code).toBe("AGENT_PROFILE_NOT_FOUND");

    const listBody = await readJson(
      await listGET(new Request(`http://localhost/api/hub/admin/agent-profiles?keyword=${slug}&status=draft&riskLevel=medium`)),
    );
    expectApiShape(listBody, true);
    expect(((listBody.data?.items as unknown[]) ?? [])).toHaveLength(1);
    expect(JSON.stringify(listBody.data)).not.toContain("sourceCode");

    const detailBody = await readJson(
      await detailGET(new Request(`http://localhost/api/hub/admin/agent-profiles/${profileId}`), profileParams(profileId)),
    );
    expectApiShape(detailBody, true);
    expect(((detailBody.data?.profile ?? {}) as Record<string, unknown>).content).toBeTruthy();

    const patchBody = await readJson(
      await detailPATCH(
        jsonRequest(
          `http://localhost/api/hub/admin/agent-profiles/${profileId}`,
          { content: createAgentProfileContent({ slug, name: "API Agent 更新", riskLevel: "high" }) },
          "PATCH",
        ),
        profileParams(profileId),
      ),
    );
    expectApiShape(patchBody, true);
    expect(((patchBody.data?.profile ?? {}) as Record<string, unknown>).riskLevel).toBe("high");

    const validateBody = await readJson(
      await validatePOST(jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}/validate`, {}), profileParams(profileId)),
    );
    expectApiShape(validateBody, true);
    expect(validateBody.data?.valid).toBe(true);

    const publishBody = await readJson(
      await publishPOST(
        jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}/publish`, { publishNote: "发布" }),
        profileParams(profileId),
      ),
    );
    expectApiShape(publishBody, true);
    expect(((publishBody.data?.profile ?? {}) as Record<string, unknown>).status).toBe("published");

    const publishedPatchBody = await readJson(
      await detailPATCH(
        jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}`, { content: createAgentProfileContent({ slug }) }, "PATCH"),
        profileParams(profileId),
      ),
    );
    expectApiShape(publishedPatchBody, false);
    expect(publishedPatchBody.error?.code).toBe("AGENT_PROFILE_UPDATE_NOT_ALLOWED");

    const exportBody = await readJson(
      await exportGET(new Request(`http://localhost/api/hub/agent-profiles/${slug}/export?version=1.0.0`), exportParams(slug)),
    );
    expectApiShape(exportBody, true);
    expect(exportBody.data).toEqual(
      expect.objectContaining({
        slug,
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(exportBody.data?.content).toBeTruthy();

    const deprecateBody = await readJson(
      await deprecatePOST(
        jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}/deprecate`, { reason: "已有新版本" }),
        profileParams(profileId),
      ),
    );
    expectApiShape(deprecateBody, true);
    expect(((deprecateBody.data?.profile ?? {}) as Record<string, unknown>).status).toBe("deprecated");

    const archiveBody = await readJson(
      await archivePOST(
        jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profileId}/archive`, { reason: "归档" }),
        profileParams(profileId),
      ),
    );
    expectApiShape(archiveBody, true);
    expect(((archiveBody.data?.profile ?? {}) as Record<string, unknown>).status).toBe("archived");

    const archivedExportBody = await readJson(
      await exportGET(new Request(`http://localhost/api/hub/agent-profiles/${slug}/export?version=1.0.0`), exportParams(slug)),
    );
    expectApiShape(archivedExportBody, false);
    expect(archivedExportBody.error?.code).toBe("AGENT_PROFILE_NOT_FOUND");
  });

  it("应拒绝敏感字段并通过 validate API 返回安全策略错误", async () => {
    const sensitiveBody = await readJson(
      await listPOST(
        jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
          slug: `sensitive-agent-${Date.now()}`,
          name: "敏感 Agent",
          version: "1.0.0",
          content: { sourceCode: "不允许" },
        }),
      ),
    );
    expectApiShape(sensitiveBody, false);
    expect(sensitiveBody.error?.code).toBe("PRIVACY_VIOLATION");

    const profile = defaultHubRepository.createAgentProfile({
      slug: `unsafe-agent-${Date.now()}`,
      name: "Unsafe Agent",
      version: "1.0.0",
      status: "draft",
      content: createAgentProfileContent({ deniedTools: ["upload-source", "deploy", "push"] }),
    });
    const validateBody = await readJson(
      await validatePOST(
        jsonRequest(`http://localhost/api/hub/admin/agent-profiles/${profile.id}/validate`, {}),
        profileParams(profile.id),
      ),
    );

    expectApiShape(validateBody, true);
    expect(validateBody.data?.valid).toBe(false);
    expect(JSON.stringify(validateBody.data)).toContain("deniedTools 必须包含 merge");
  });
});
