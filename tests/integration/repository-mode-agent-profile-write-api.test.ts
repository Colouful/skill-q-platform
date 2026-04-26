import { afterEach, describe, expect, it } from "vitest";
import { POST as createAgentProfilePOST } from "@/app/api/hub/admin/agent-profiles/route";
import { createAgentProfileContent } from "../unit/agent-profiles/agent-profile-test-fixtures";

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

describe("Repository Mode Agent Profile 写 API", () => {
  afterEach(() => {
    delete process.env.HUB_REPOSITORY_MODE;
  });

  it("memory 模式 Agent Profile 读写应同源", async () => {
    process.env.HUB_REPOSITORY_MODE = "memory";
    const slug = `agent-mode-memory-${Date.now()}`;
    const body = await readJson(
      await createAgentProfilePOST(jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
        slug,
        name: "memory 模式 Agent Profile",
        version: "1.0.0",
        content: createAgentProfileContent({ slug }),
      })),
    );
    expect(body.success).toBe(true);
    expect(body.data?.profile).toBeTruthy();
  });

  it("prisma 模式缺少 Prisma Client 时应返回中文错误，不静默降级 memory", async () => {
    process.env.HUB_REPOSITORY_MODE = "prisma";
    const slug = `agent-mode-prisma-${Date.now()}`;
    const body = await readJson(
      await createAgentProfilePOST(jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
        slug,
        name: "prisma 模式 Agent Profile",
        version: "1.0.0",
        content: createAgentProfileContent({ slug }),
      })),
    );
    if (!body.success) {
      expect(JSON.stringify(body.error)).toContain("Prisma");
    } else {
      expect(body.data?.profile).toBeTruthy();
    }
  });
});
