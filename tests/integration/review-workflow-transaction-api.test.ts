import { describe, expect, it } from "vitest";
import { GET as auditGET } from "@/app/api/hub/admin/audit-logs/route";
import { POST as assetCreatePOST } from "@/app/api/hub/admin/assets/route";
import { POST as assetPublishPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/publish/route";
import { POST as assetRejectPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/reject/route";
import { POST as assetSubmitPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/submit-review/route";
import { POST as assetVersionPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";
import { AuditLogService } from "@/server/hub/audit-log-service";

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

describe("Review Workflow transaction API", () => {
  it("Asset Version submit-review / reject / publish 通过 API 写入状态和审计日志", async () => {
    new AuditLogService().clear();
    const slug = `p36-api-asset-${Date.now()}`;
    const assetBody = await readJson(await assetCreatePOST(jsonRequest("http://localhost/api/hub/admin/assets", {
      slug,
      name: "P3.6 API 资产",
      kind: "rule",
      scope: "platform",
    })));
    const assetId = String((assetBody.data?.asset as Record<string, unknown>).id);
    const versionBody = await readJson(await assetVersionPOST(jsonRequest("http://localhost/versions", {
      version: "1.0.0",
      content: "# P3.6\n",
    }), assetParams(assetId)));
    const versionId = String((versionBody.data?.version as Record<string, unknown>).id);

    await expect(readJson(await assetSubmitPOST(jsonRequest("http://localhost/submit", { note: "提交审核" }), assetVersionParams(assetId, versionId)))).resolves.toMatchObject({
      success: true,
      data: { version: { status: "reviewing" } },
    });
    await expect(readJson(await assetRejectPOST(jsonRequest("http://localhost/reject", { reason: "补充说明" }), assetVersionParams(assetId, versionId)))).resolves.toMatchObject({
      success: true,
      data: { version: { status: "rejected" } },
    });
    await assetSubmitPOST(jsonRequest("http://localhost/submit", { note: "重新提交" }), assetVersionParams(assetId, versionId));
    await expect(readJson(await assetPublishPOST(jsonRequest("http://localhost/publish", { publishNote: "发布" }), assetVersionParams(assetId, versionId)))).resolves.toMatchObject({
      success: true,
      data: { version: { status: "published" } },
    });

    const audit = await readJson(await auditGET(new Request(`http://localhost/api/hub/admin/audit-logs?targetId=${versionId}`)));
    const actions = ((audit.data?.items ?? []) as Array<Record<string, unknown>>).map((item) => item.action);
    expect(actions).toEqual(expect.arrayContaining(["submit-review", "reject", "publish"]));
  });
});
