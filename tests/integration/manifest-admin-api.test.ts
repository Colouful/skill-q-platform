import { describe, expect, it } from "vitest";
import { POST as archivePOST } from "@/app/api/hub/admin/manifests/[manifestId]/archive/route";
import { GET as detailGET, PATCH as detailPATCH } from "@/app/api/hub/admin/manifests/[manifestId]/route";
import { POST as bindPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/assets/route";
import { DELETE as unbindDELETE } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/assets/[bindingId]/route";
import { PATCH as reorderPATCH } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/assets/reorder/route";
import { POST as deprecatePOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/deprecate/route";
import { POST as publishPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/publish/route";
import { GET as versionDetailGET } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/route";
import { POST as versionsPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/route";
import { GET as listGET, POST as listPOST } from "@/app/api/hub/admin/manifests/route";
import { defaultHubRepository } from "@/server/hub";

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

function manifestParams(manifestId: string) {
  return { params: Promise.resolve({ manifestId }) };
}

function versionParams(manifestId: string, versionId: string) {
  return { params: Promise.resolve({ manifestId, versionId }) };
}

function bindingParams(manifestId: string, versionId: string, bindingId: string) {
  return { params: Promise.resolve({ manifestId, versionId, bindingId }) };
}

function getSeedAsset() {
  const asset = defaultHubRepository.assets.find((item) => item.slug === "planner-role");
  const assetVersion = defaultHubRepository.assetVersions.find(
    (item) => item.assetId === asset?.id && item.version === "1.0.0",
  );
  if (!asset || !assetVersion) throw new Error("测试 seed 缺少 planner-role");
  return { asset, assetVersion };
}

describe("Manifest Admin API", () => {
  it("应完成创建、查询、更新、创建版本、绑定、排序、发布、废弃和归档流程", async () => {
    const slug = `api-manifest-${Date.now()}`;
    const createBody = await readJson(
      await listPOST(
        jsonRequest("http://localhost/api/hub/admin/manifests", {
          slug,
          name: "API Manifest",
          scope: "platform",
          description: "用于 Manifest Admin API 测试",
          tags: ["manifest-api"],
          techStacks: ["react"],
          projectKinds: ["frontend"],
          recommendedFor: ["web"],
        }),
      ),
    );
    const manifest = (createBody.data?.manifest ?? {}) as Record<string, unknown>;
    const manifestId = String(manifest.id);
    expectApiShape(createBody, true);
    expect(manifest).toEqual(expect.objectContaining({ slug, status: "draft" }));

    const listBody = await readJson(
      await listGET(new Request(`http://localhost/api/hub/admin/manifests?keyword=${slug}&status=draft`)),
    );
    expectApiShape(listBody, true);
    expect(((listBody.data?.items as unknown[]) ?? [])).toHaveLength(1);

    const patchBody = await readJson(
      await detailPATCH(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}`, { name: "API Manifest 更新" }, "PATCH"),
        manifestParams(manifestId),
      ),
    );
    expectApiShape(patchBody, true);
    expect(((patchBody.data?.manifest ?? {}) as Record<string, unknown>).name).toBe("API Manifest 更新");

    const versionBody = await readJson(
      await versionsPOST(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions`, {
          version: "1.0.0",
          changelog: "初始版本",
        }),
        manifestParams(manifestId),
      ),
    );
    const version = (versionBody.data?.version ?? {}) as Record<string, unknown>;
    const versionId = String(version.id);
    expectApiShape(versionBody, true);
    expect(version).toEqual(
      expect.objectContaining({
        status: "draft",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );

    const { asset, assetVersion } = getSeedAsset();
    const bindBody = await readJson(
      await bindPOST(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets`, {
          assetId: asset.id,
          assetVersionId: assetVersion.id,
          kind: "role",
          required: true,
          loadWhen: ["planning"],
          order: 20,
        }),
        versionParams(manifestId, versionId),
      ),
    );
    const binding = (bindBody.data?.binding ?? {}) as Record<string, unknown>;
    const bindingId = String(binding.bindingId);
    expectApiShape(bindBody, true);
    expect(binding).toEqual(
      expect.objectContaining({
        assetSlug: "planner-role",
        assetVersion: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );

    const reorderBody = await readJson(
      await reorderPATCH(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets/reorder`, {
          items: [{ bindingId, order: 5 }],
        }, "PATCH"),
        versionParams(manifestId, versionId),
      ),
    );
    expectApiShape(reorderBody, true);
    expect(((reorderBody.data?.items as Array<Record<string, unknown>>) ?? [])[0].order).toBe(5);

    const detailVersionBody = await readJson(
      await versionDetailGET(
        new Request(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}`),
        versionParams(manifestId, versionId),
      ),
    );
    expectApiShape(detailVersionBody, true);
    expect(JSON.stringify(detailVersionBody.data)).not.toContain(assetVersion.content);
    expect(((detailVersionBody.data?.assets as Array<Record<string, unknown>>) ?? [])[0]).not.toHaveProperty("content");

    const publishBody = await readJson(
      await publishPOST(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}/publish`, {
          publishNote: "发布测试",
        }),
        versionParams(manifestId, versionId),
      ),
    );
    expectApiShape(publishBody, true);
    expect(((publishBody.data?.version ?? {}) as Record<string, unknown>).status).toBe("published");

    const publishedReorderBody = await readJson(
      await reorderPATCH(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets/reorder`, {
          items: [{ bindingId, order: 10 }],
        }, "PATCH"),
        versionParams(manifestId, versionId),
      ),
    );
    expectApiShape(publishedReorderBody, false);
    expect(publishedReorderBody.error?.code).toBe("MANIFEST_ASSET_BINDING_NOT_ALLOWED");

    const publishedUnbindBody = await readJson(
      await unbindDELETE(
        new Request(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets/${bindingId}`, {
          method: "DELETE",
        }),
        bindingParams(manifestId, versionId, bindingId),
      ),
    );
    expectApiShape(publishedUnbindBody, false);
    expect(publishedUnbindBody.error?.code).toBe("MANIFEST_ASSET_BINDING_NOT_ALLOWED");

    const deprecateBody = await readJson(
      await deprecatePOST(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions/${versionId}/deprecate`, {
          reason: "已有新版本",
        }),
        versionParams(manifestId, versionId),
      ),
    );
    expectApiShape(deprecateBody, true);
    expect(((deprecateBody.data?.version ?? {}) as Record<string, unknown>).status).toBe("deprecated");

    const archiveBody = await readJson(
      await archivePOST(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/archive`, { reason: "归档测试" }),
        manifestParams(manifestId),
      ),
    );
    expectApiShape(archiveBody, true);
    expect(((archiveBody.data?.manifest ?? {}) as Record<string, unknown>).status).toBe("archived");

    const detailBody = await readJson(
      await detailGET(new Request(`http://localhost/api/hub/admin/manifests/${manifestId}`), manifestParams(manifestId)),
    );
    expectApiShape(detailBody, true);
    expect(JSON.stringify(detailBody.data)).not.toContain("sourceCode");
    expect(JSON.stringify(detailBody.data)).not.toContain("rawPrompt");
    expect(JSON.stringify(detailBody.data)).not.toContain("rawResponse");
    expect(JSON.stringify(detailBody.data)).not.toContain("/Users/");
  });

  it("应拒绝敏感字段和非法绑定", async () => {
    const sensitiveBody = await readJson(
      await listPOST(
        jsonRequest("http://localhost/api/hub/admin/manifests", {
          slug: `sensitive-manifest-${Date.now()}`,
          name: "敏感字段",
          scope: "platform",
          sourceCode: "不允许",
        }),
      ),
    );
    expectApiShape(sensitiveBody, false);
    expect(sensitiveBody.error?.code).toBe("PRIVACY_VIOLATION");
  });
});
