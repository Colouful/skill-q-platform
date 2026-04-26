import { describe, expect, it } from "vitest";
import { POST as createManifestPOST } from "@/app/api/hub/admin/manifests/route";
import { POST as createVersionPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/route";

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

describe("Manifest 写事务 API", () => {
  it("应通过 API 创建 Manifest 和 Manifest Version", async () => {
    const slug = `manifest-write-api-${Date.now()}`;
    const manifestBody = await readJson(
      await createManifestPOST(jsonRequest("http://localhost/api/hub/admin/manifests", {
        slug,
        name: "写事务 Manifest",
        scope: "platform",
      })),
    );
    expect(manifestBody.success).toBe(true);
    const manifestId = String((manifestBody.data?.manifest as Record<string, unknown>).id);

    const versionBody = await readJson(
      await createVersionPOST(
        jsonRequest(`http://localhost/api/hub/admin/manifests/${manifestId}/versions`, { version: "1.0.0" }),
        { params: Promise.resolve({ manifestId }) },
      ),
    );
    expect(versionBody.success).toBe(true);
    expect((versionBody.data?.version as Record<string, unknown>).checksum).toEqual(expect.stringMatching(/^sha256:/));
  });
});
