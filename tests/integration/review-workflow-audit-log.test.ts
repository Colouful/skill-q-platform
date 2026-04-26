import { describe, expect, it } from "vitest";
import { POST as agentCreatePOST } from "@/app/api/hub/admin/agent-profiles/route";
import { POST as agentPublishPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/publish/route";
import { POST as agentRejectPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/reject/route";
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

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function profileParams(profileId: string) {
  return { params: Promise.resolve({ profileId }) };
}

describe("Review Workflow AuditLog", () => {
  it("submit-review / reject / publish 成功后应写入审计日志", async () => {
    new AuditLogService().clear();
    const slug = `audit-agent-${Date.now()}`;
    const createBody = await readJson(await agentCreatePOST(jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
      slug,
      name: "审计 Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug, name: "审计 Agent" }),
    })));
    const profileId = String(((createBody.data?.profile ?? {}) as Record<string, unknown>).id);

    await agentSubmitPOST(jsonRequest("http://localhost/submit", { note: "提交审核" }), profileParams(profileId));
    await agentRejectPOST(jsonRequest("http://localhost/reject", { reason: "补充说明" }), profileParams(profileId));
    await agentSubmitPOST(jsonRequest("http://localhost/submit", { note: "重新提交" }), profileParams(profileId));
    await agentPublishPOST(jsonRequest("http://localhost/publish", { publishNote: "发布" }), profileParams(profileId));

    const auditBody = await readJson(await auditGET(new Request(`http://localhost/api/hub/admin/audit-logs?targetId=${profileId}`)));
    const items = ((auditBody.data?.items ?? []) as Array<Record<string, unknown>>).map((item) => item.action);

    expect(auditBody.success).toBe(true);
    expect(items).toEqual(expect.arrayContaining(["submit-review", "reject", "publish"]));
  });
});
