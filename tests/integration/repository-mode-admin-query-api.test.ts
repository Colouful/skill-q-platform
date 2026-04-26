import { describe, expect, it } from "vitest";
import { GET as agentProfilesGET } from "@/app/api/hub/admin/agent-profiles/route";
import { GET as assetsGET } from "@/app/api/hub/admin/assets/route";
import { GET as manifestsGET } from "@/app/api/hub/admin/manifests/route";

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

function expectApiShape(body: ApiBody) {
  expect(Object.keys(body).sort()).toEqual(["data", "error", "requestId", "success", "timestamp"]);
  expect(body.success).toBe(true);
  expect(body.error).toBeNull();
  expect(body.requestId).toEqual(expect.any(String));
  expect(body.timestamp).toEqual(expect.any(String));
}

describe("Repository Mode Admin Query API", () => {
  it("Asset / Manifest / Agent Profile 查询 API 应保持 V2.1 响应结构", async () => {
    const assetBody = await readJson(await assetsGET(new Request("http://localhost/api/hub/admin/assets?page=1&pageSize=5")));
    const manifestBody = await readJson(await manifestsGET(new Request("http://localhost/api/hub/admin/manifests?page=1&pageSize=5")));
    const profileBody = await readJson(
      await agentProfilesGET(new Request("http://localhost/api/hub/admin/agent-profiles?page=1&pageSize=5")),
    );

    for (const body of [assetBody, manifestBody, profileBody]) {
      expectApiShape(body);
      expect(body.data?.pagination).toEqual(expect.objectContaining({ page: 1, pageSize: 5 }));
      expect(Array.isArray(body.data?.items)).toBe(true);
      expect(JSON.stringify(body)).not.toContain("sourceCode");
      expect(JSON.stringify(body)).not.toContain("rawPrompt");
      expect(JSON.stringify(body)).not.toContain("rawResponse");
      expect(JSON.stringify(body)).not.toContain("/Users/");
    }
  });
});
