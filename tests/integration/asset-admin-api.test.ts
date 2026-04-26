import { describe, expect, it } from "vitest";
import { POST as archivePOST } from "@/app/api/hub/admin/assets/[assetId]/archive/route";
import { GET as detailGET, PATCH as detailPATCH } from "@/app/api/hub/admin/assets/[assetId]/route";
import { GET as versionDetailGET } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/route";
import { POST as deprecatePOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/deprecate/route";
import { POST as publishPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/publish/route";
import { GET as versionsGET, POST as versionsPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";
import { GET as listGET, POST as listPOST } from "@/app/api/hub/admin/assets/route";

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
  expect(body.requestId).toEqual(expect.any(String));
  expect(body.timestamp).toEqual(expect.any(String));
  if (success) {
    expect(body.error).toBeNull();
  } else {
    expect(body.data).toBeNull();
    expect(Object.keys(body.error ?? {}).sort()).toEqual(["code", "message", "suggestion"]);
  }
}

function params(assetId: string) {
  return { params: Promise.resolve({ assetId }) };
}

function versionParams(assetId: string, versionId: string) {
  return { params: Promise.resolve({ assetId, versionId }) };
}

describe("Asset Admin API", () => {
  it("应完成创建、查询、更新、创建版本、发布、废弃和归档流程", async () => {
    const slug = `api-rule-${Date.now()}`;
    const createResponse = await listPOST(
      jsonRequest("http://localhost/api/hub/admin/assets", {
        slug,
        name: "API 规则",
        kind: "rule",
        scope: "platform",
        description: "用于 Asset Admin API 测试",
        tags: ["api-admin"],
        visibility: "public",
      }),
    );
    const createBody = await readJson(createResponse);
    const asset = (createBody.data?.asset ?? {}) as Record<string, unknown>;
    const assetId = String(asset.id);

    expectApiShape(createBody, true);
    expect(asset).toEqual(expect.objectContaining({ slug, status: "draft" }));

    const listBody = await readJson(
      await listGET(new Request(`http://localhost/api/hub/admin/assets?keyword=${slug}&kind=rule&status=draft`)),
    );
    expectApiShape(listBody, true);
    expect(((listBody.data?.items as unknown[]) ?? [])).toHaveLength(1);

    const patchBody = await readJson(
      await detailPATCH(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}`, { name: "API 规则更新" }, "PATCH"),
        params(assetId),
      ),
    );
    expectApiShape(patchBody, true);
    expect(((patchBody.data?.asset ?? {}) as Record<string, unknown>).name).toBe("API 规则更新");

    const versionBody = await readJson(
      await versionsPOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions`, {
          version: "1.0.0",
          content: "# API Rule\n",
          contentFormat: "markdown",
          source: "manual",
        }),
        params(assetId),
      ),
    );
    const version = (versionBody.data?.version ?? {}) as Record<string, unknown>;
    const versionId = String(version.id);
    const checksum = String(version.checksum);
    expectApiShape(versionBody, true);
    expect(version).toEqual(
      expect.objectContaining({
        status: "draft",
        immutable: false,
        checksum: expect.stringMatching(/^sha256:/),
        contentSize: "# API Rule\n".length,
      }),
    );

    const versionsBody = await readJson(
      await versionsGET(new Request(`http://localhost/api/hub/admin/assets/${assetId}/versions`), params(assetId)),
    );
    expectApiShape(versionsBody, true);
    expect(((versionsBody.data?.items as Array<Record<string, unknown>>) ?? [])[0]).not.toHaveProperty("content");

    const versionDetailBody = await readJson(
      await versionDetailGET(
        new Request(`http://localhost/api/hub/admin/assets/${assetId}/versions/${versionId}`),
        versionParams(assetId, versionId),
      ),
    );
    expectApiShape(versionDetailBody, true);
    expect(((versionDetailBody.data?.version ?? {}) as Record<string, unknown>).content).toBe("# API Rule\n");

    const publishBody = await readJson(
      await publishPOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions/${versionId}/publish`, {
          publishNote: "发布测试",
        }),
        versionParams(assetId, versionId),
      ),
    );
    const published = (publishBody.data?.version ?? {}) as Record<string, unknown>;
    expectApiShape(publishBody, true);
    expect(published.status).toBe("published");
    expect(published.immutable).toBe(true);
    expect(published.checksum).toBe(checksum);

    const publishedUpdateBody = await readJson(
      await detailPATCH(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}`, { name: "发布后不允许" }, "PATCH"),
        params(assetId),
      ),
    );
    expectApiShape(publishedUpdateBody, false);
    expect(publishedUpdateBody.error?.code).toBe("ASSET_UPDATE_NOT_ALLOWED");

    const deprecateBody = await readJson(
      await deprecatePOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions/${versionId}/deprecate`, {
          reason: "已有新版本",
        }),
        versionParams(assetId, versionId),
      ),
    );
    expectApiShape(deprecateBody, true);
    expect(((deprecateBody.data?.version ?? {}) as Record<string, unknown>).checksum).toBe(checksum);
    expect(((deprecateBody.data?.version ?? {}) as Record<string, unknown>).status).toBe("deprecated");

    const archiveBody = await readJson(
      await archivePOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/archive`, { reason: "归档测试" }),
        params(assetId),
      ),
    );
    expectApiShape(archiveBody, true);
    expect(((archiveBody.data?.asset ?? {}) as Record<string, unknown>).status).toBe("archived");

    const archivedVersionBody = await readJson(
      await versionsPOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions`, {
          version: "1.1.0",
          content: "# 不允许\n",
        }),
        params(assetId),
      ),
    );
    expectApiShape(archivedVersionBody, false);
    expect(archivedVersionBody.error?.code).toBe("ASSET_ARCHIVED");

    const detailBody = await readJson(
      await detailGET(new Request(`http://localhost/api/hub/admin/assets/${assetId}`), params(assetId)),
    );
    expectApiShape(detailBody, true);
    expect(((detailBody.data?.versions as Array<Record<string, unknown>>) ?? [])[0]).not.toHaveProperty("content");
    expect(JSON.stringify(detailBody.data)).not.toContain("sourceCode");
    expect(JSON.stringify(detailBody.data)).not.toContain("rawPrompt");
    expect(JSON.stringify(detailBody.data)).not.toContain("rawResponse");
    expect(JSON.stringify(detailBody.data)).not.toContain("/Users/");
  });

  it("应返回中文错误并拒绝敏感字段", async () => {
    const invalidKindBody = await readJson(
      await listPOST(
        jsonRequest("http://localhost/api/hub/admin/assets", {
          slug: `bad-kind-${Date.now()}`,
          name: "非法类型",
          kind: "manifest",
          scope: "platform",
        }),
      ),
    );
    expectApiShape(invalidKindBody, false);
    expect(invalidKindBody.error?.code).toBe("INVALID_ASSET_KIND");
    expect(invalidKindBody.error?.message).toContain("资产类型不合法");

    const sensitiveBody = await readJson(
      await listPOST(
        jsonRequest("http://localhost/api/hub/admin/assets", {
          slug: `sensitive-${Date.now()}`,
          name: "敏感字段",
          kind: "rule",
          scope: "platform",
          sourceCode: "不允许",
        }),
      ),
    );
    expectApiShape(sensitiveBody, false);
    expect(sensitiveBody.error?.code).toBe("PRIVACY_VIOLATION");
  });
});
