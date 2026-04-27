import { describe, expect, it } from "vitest";
import { POST as agentCreatePOST } from "@/app/api/hub/admin/agent-profiles/route";
import { POST as agentPublishPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/publish/route";
import { POST as agentSubmitPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/submit-review/route";
import { GET as auditGET } from "@/app/api/hub/admin/audit-logs/route";
import { AuditLogService } from "@/server/hub/audit-log-service";
import { createAgentProfileContent } from "../unit/agent-profiles/agent-profile-test-fixtures";

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

function profileParams(profileId: string) {
  return { params: Promise.resolve({ profileId }) };
}

describe("Review Workflow AuditLog 去重", () => {
  it("Agent Profile publish 只写入一条 publish AuditLog", async () => {
    new AuditLogService().clear();
    const slug = `p36-no-dup-agent-${Date.now()}`;
    const createBody = await readJson(await agentCreatePOST(jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
      slug,
      name: "去重 Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug, name: "去重 Agent" }),
    })));
    const profileId = String((createBody.data?.profile as Record<string, unknown>).id);

    await agentSubmitPOST(jsonRequest("http://localhost/submit", {}), profileParams(profileId));
    await agentPublishPOST(jsonRequest("http://localhost/publish", {}), profileParams(profileId));

    const audit = await readJson(await auditGET(new Request(`http://localhost/api/hub/admin/audit-logs?targetId=${profileId}&action=publish`)));
    expect(audit.success).toBe(true);
    expect((audit.data?.items as unknown[]) ?? []).toHaveLength(1);
  });
});
