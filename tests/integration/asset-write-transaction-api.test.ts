import { describe, expect, it } from "vitest";
import { POST as createAssetPOST } from "@/app/api/hub/admin/assets/route";
import { POST as createVersionPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";
import { POST as publishPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/publish/route";

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

function params(assetId: string) {
  return { params: Promise.resolve({ assetId }) };
}

function versionParams(assetId: string, versionId: string) {
  return { params: Promise.resolve({ assetId, versionId }) };
}

describe("Asset 写事务 API", () => {
  it("应通过 API 创建 Asset、创建版本并发布", async () => {
    const slug = `asset-write-api-${Date.now()}`;
    const createdAsset = await readJson(
      await createAssetPOST(
        jsonRequest("http://localhost/api/hub/admin/assets", {
          slug,
          name: "写事务 API 资产",
          kind: "rule",
          scope: "platform",
        }),
      ),
    );
    expect(createdAsset.success).toBe(true);
    const asset = (createdAsset.data?.asset ?? {}) as Record<string, unknown>;
    const assetId = String(asset.id);

    const createdVersion = await readJson(
      await createVersionPOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions`, {
          version: "1.0.0",
          content: "# Write API\n",
        }),
        params(assetId),
      ),
    );
    expect(createdVersion.success).toBe(true);
    const version = (createdVersion.data?.version ?? {}) as Record<string, unknown>;

    const published = await readJson(
      await publishPOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions/${version.id}/publish`, {
          publishNote: "事务发布",
        }),
        versionParams(assetId, String(version.id)),
      ),
    );

    expect(published.success).toBe(true);
    expect((published.data?.version as Record<string, unknown>)).toMatchObject({
      status: "published",
      immutable: true,
    });
  });
});
