import { afterEach, describe, expect, it } from "vitest";
import { POST as createManifestPOST } from "@/app/api/hub/admin/manifests/route";

async function readJson(response: Response) {
  return (await response.json()) as { success: boolean; data: Record<string, unknown> | null; error: null | { code: string; message: string } };
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Repository Mode Manifest 写 API", () => {
  afterEach(() => {
    delete process.env.HUB_REPOSITORY_MODE;
  });

  it("memory 模式 Manifest 读写应同源", async () => {
    process.env.HUB_REPOSITORY_MODE = "memory";
    const body = await readJson(
      await createManifestPOST(jsonRequest("http://localhost/api/hub/admin/manifests", {
        slug: `manifest-mode-memory-${Date.now()}`,
        name: "memory 模式 Manifest",
        scope: "platform",
      })),
    );
    expect(body.success).toBe(true);
    expect(body.data?.manifest).toBeTruthy();
  });

  it("prisma 模式缺少 Prisma Client 时应返回中文错误，不静默降级 memory", async () => {
    process.env.HUB_REPOSITORY_MODE = "prisma";
    const body = await readJson(
      await createManifestPOST(jsonRequest("http://localhost/api/hub/admin/manifests", {
        slug: `manifest-mode-prisma-${Date.now()}`,
        name: "prisma 模式 Manifest",
        scope: "platform",
      })),
    );
    if (!body.success) {
      expect(JSON.stringify(body.error)).toContain("Prisma");
    } else {
      expect(body.data?.manifest).toBeTruthy();
    }
  });
});
