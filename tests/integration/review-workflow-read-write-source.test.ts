import { describe, expect, it } from "vitest";
import { GET as assetDetailGET } from "@/app/api/hub/admin/assets/[assetId]/route";
import { POST as assetCreatePOST } from "@/app/api/hub/admin/assets/route";
import { POST as assetSubmitPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/submit-review/route";
import { POST as assetVersionPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";

type ApiBody = {
  success: boolean;
  data: Record<string, unknown> | null;
  error: null | { code: string; message: string; suggestion: string };
};

async function readJson(response: Response) {
  return (await response.json()) as ApiBody;
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function assetParams(assetId: string) {
  return { params: Promise.resolve({ assetId }) };
}

function assetVersionParams(assetId: string, versionId: string) {
  return { params: Promise.resolve({ assetId, versionId }) };
}

describe("Review Workflow read/write source", () => {
  it("submit-review 后详情查询能读取同源状态且不返回敏感字段", async () => {
    const slug = `p36-source-asset-${Date.now()}`;
    const assetBody = await readJson(await assetCreatePOST(jsonRequest("http://localhost/api/hub/admin/assets", {
      slug,
      name: "读写同源资产",
      kind: "rule",
      scope: "platform",
    })));
    const assetId = String((assetBody.data?.asset as Record<string, unknown>).id);
    const versionBody = await readJson(await assetVersionPOST(jsonRequest("http://localhost/versions", {
      version: "1.0.0",
      content: "# Source\n",
    }), assetParams(assetId)));
    const versionId = String((versionBody.data?.version as Record<string, unknown>).id);

    await assetSubmitPOST(jsonRequest("http://localhost/submit", {}), assetVersionParams(assetId, versionId));

    const detail = await readJson(await assetDetailGET(new Request(`http://localhost/api/hub/admin/assets/${assetId}`), assetParams(assetId)));
    const serialized = JSON.stringify(detail);
    expect(serialized).toContain("\"status\":\"reviewing\"");
    expect(serialized).not.toContain("sourceCode");
    expect(serialized).not.toContain("rawPrompt");
    expect(serialized).not.toContain("rawResponse");
    expect(serialized).not.toContain("/Users/");
  });
});
