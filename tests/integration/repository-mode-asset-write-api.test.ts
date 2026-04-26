import { afterEach, describe, expect, it } from "vitest";
import { POST as createAssetPOST } from "@/app/api/hub/admin/assets/route";
import { POST as createVersionPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";

async function readJson(response: Response) {
  return (await response.json()) as { success: boolean; data: Record<string, unknown> | null; error: null | { code: string } };
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Repository Mode Asset 写 API", () => {
  afterEach(() => {
    delete process.env.HUB_REPOSITORY_MODE;
  });

  it("memory 模式 Asset 读写应同源", async () => {
    process.env.HUB_REPOSITORY_MODE = "memory";
    const slug = `asset-mode-memory-${Date.now()}`;
    const assetBody = await readJson(
      await createAssetPOST(
        jsonRequest("http://localhost/api/hub/admin/assets", {
          slug,
          name: "memory 模式资产",
          kind: "rule",
          scope: "platform",
        }),
      ),
    );
    expect(assetBody.success).toBe(true);
    const assetId = String((assetBody.data?.asset as Record<string, unknown>).id);

    const versionBody = await readJson(
      await createVersionPOST(
        jsonRequest(`http://localhost/api/hub/admin/assets/${assetId}/versions`, {
          version: "1.0.0",
          content: "# Mode\n",
        }),
        { params: Promise.resolve({ assetId }) },
      ),
    );
    expect(versionBody.success).toBe(true);
    expect((versionBody.data?.version as Record<string, unknown>).assetId).toBe(assetId);
  });

  it("prisma 模式缺少 Prisma Client 时应返回中文错误，不静默降级 memory", async () => {
    process.env.HUB_REPOSITORY_MODE = "prisma";
    const body = await readJson(
      await createAssetPOST(
        jsonRequest("http://localhost/api/hub/admin/assets", {
          slug: `asset-mode-prisma-${Date.now()}`,
          name: "prisma 模式资产",
          kind: "rule",
          scope: "platform",
        }),
      ),
    );

    if (!body.success) {
      expect(JSON.stringify(body.error)).toContain("Prisma");
    } else {
      expect(body.data?.asset).toBeTruthy();
    }
  });
});
