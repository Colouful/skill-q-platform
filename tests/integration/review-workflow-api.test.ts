import { describe, expect, it } from "vitest";
import { POST as agentCreatePOST } from "@/app/api/hub/admin/agent-profiles/route";
import { POST as agentPublishPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/publish/route";
import { POST as agentRejectPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/reject/route";
import { POST as agentSubmitPOST } from "@/app/api/hub/admin/agent-profiles/[profileId]/submit-review/route";
import { GET as auditGET } from "@/app/api/hub/admin/audit-logs/route";
import { POST as assetCreatePOST } from "@/app/api/hub/admin/assets/route";
import { POST as assetPublishPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/publish/route";
import { POST as assetRejectPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/reject/route";
import { POST as assetSubmitPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/submit-review/route";
import { POST as assetVersionPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";
import { POST as manifestCreatePOST } from "@/app/api/hub/admin/manifests/route";
import { POST as manifestBindPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/assets/route";
import { POST as manifestPublishPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/publish/route";
import { POST as manifestRejectPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/reject/route";
import { POST as manifestSubmitPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/[versionId]/submit-review/route";
import { POST as manifestVersionPOST } from "@/app/api/hub/admin/manifests/[manifestId]/versions/route";
import { defaultHubRepository } from "@/server/hub";
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

function assetParams(assetId: string) {
  return { params: Promise.resolve({ assetId }) };
}

function assetVersionParams(assetId: string, versionId: string) {
  return { params: Promise.resolve({ assetId, versionId }) };
}

function manifestParams(manifestId: string) {
  return { params: Promise.resolve({ manifestId }) };
}

function manifestVersionParams(manifestId: string, versionId: string) {
  return { params: Promise.resolve({ manifestId, versionId }) };
}

function profileParams(profileId: string) {
  return { params: Promise.resolve({ profileId }) };
}

describe("Review Workflow API", () => {
  it("应支持 Asset Version 提交审核、驳回、重新提交和发布，并写入审计占位", async () => {
    const slug = `review-asset-${Date.now()}`;
    const assetBody = await readJson(await assetCreatePOST(jsonRequest("http://localhost/api/hub/admin/assets", {
      slug,
      name: "审核资产",
      kind: "rule",
      scope: "platform",
    })));
    const asset = (assetBody.data?.asset ?? {}) as Record<string, unknown>;
    const assetId = String(asset.id);
    const versionBody = await readJson(await assetVersionPOST(jsonRequest("http://localhost/api/hub/admin/assets/x/versions", {
      version: "1.0.0",
      content: "# Review\n",
    }), assetParams(assetId)));
    const versionId = String(((versionBody.data?.version ?? {}) as Record<string, unknown>).id);

    expect((await readJson(await assetSubmitPOST(jsonRequest("http://localhost/submit", { note: "提交" }), assetVersionParams(assetId, versionId)))).data?.version).toEqual(expect.objectContaining({ status: "reviewing" }));
    expect((await readJson(await assetRejectPOST(jsonRequest("http://localhost/reject", { reason: "需要调整" }), assetVersionParams(assetId, versionId)))).data?.version).toEqual(expect.objectContaining({ status: "rejected", rejectedReason: "需要调整" }));
    await assetSubmitPOST(jsonRequest("http://localhost/submit", { note: "重新提交" }), assetVersionParams(assetId, versionId));
    expect((await readJson(await assetPublishPOST(jsonRequest("http://localhost/publish", { publishNote: "发布" }), assetVersionParams(assetId, versionId)))).data?.version).toEqual(expect.objectContaining({ status: "published" }));
  });

  it("应支持 Manifest Version 提交审核、驳回和发布", async () => {
    const manifestBody = await readJson(await manifestCreatePOST(jsonRequest("http://localhost/api/hub/admin/manifests", {
      slug: `review-manifest-${Date.now()}`,
      name: "审核 Manifest",
      scope: "platform",
    })));
    const manifestId = String(((manifestBody.data?.manifest ?? {}) as Record<string, unknown>).id);
    const versionBody = await readJson(await manifestVersionPOST(jsonRequest("http://localhost/versions", { version: "1.0.0" }), manifestParams(manifestId)));
    const versionId = String(((versionBody.data?.version ?? {}) as Record<string, unknown>).id);
    const seedAsset = defaultHubRepository.assets.find((item) => item.slug === "planner-role");
    const seedVersion = defaultHubRepository.assetVersions.find((item) => item.assetId === seedAsset?.id && item.status === "published");
    if (!seedAsset || !seedVersion) throw new Error("测试 seed 缺少 planner-role");
    await manifestBindPOST(jsonRequest("http://localhost/bind", {
      assetId: seedAsset.id,
      assetVersionId: seedVersion.id,
      kind: "role",
      required: true,
    }), manifestVersionParams(manifestId, versionId));

    expect((await readJson(await manifestSubmitPOST(jsonRequest("http://localhost/submit", {}), manifestVersionParams(manifestId, versionId)))).data?.version).toEqual(expect.objectContaining({ status: "reviewing" }));
    expect((await readJson(await manifestRejectPOST(jsonRequest("http://localhost/reject", { reason: "补充说明" }), manifestVersionParams(manifestId, versionId)))).data?.version).toEqual(expect.objectContaining({ status: "rejected" }));
    await manifestSubmitPOST(jsonRequest("http://localhost/submit", {}), manifestVersionParams(manifestId, versionId));
    expect((await readJson(await manifestPublishPOST(jsonRequest("http://localhost/publish", {}), manifestVersionParams(manifestId, versionId)))).data?.version).toEqual(expect.objectContaining({ status: "published" }));
  });

  it("应支持 Agent Profile 提交审核、驳回和发布，并拒绝空驳回原因", async () => {
    const slug = `review-agent-${Date.now()}`;
    const createBody = await readJson(await agentCreatePOST(jsonRequest("http://localhost/api/hub/admin/agent-profiles", {
      slug,
      name: "审核 Agent",
      version: "1.0.0",
      content: createAgentProfileContent({ slug, name: "审核 Agent" }),
    })));
    const profileId = String(((createBody.data?.profile ?? {}) as Record<string, unknown>).id);

    expect((await readJson(await agentSubmitPOST(jsonRequest("http://localhost/submit", {}), profileParams(profileId)))).data?.profile).toEqual(expect.objectContaining({ status: "reviewing" }));
    const emptyReject = await readJson(await agentRejectPOST(jsonRequest("http://localhost/reject", { reason: "" }), profileParams(profileId)));
    expect(emptyReject.success).toBe(false);
    expect(emptyReject.error?.code).toBe("REVIEW_REASON_REQUIRED");
    expect((await readJson(await agentRejectPOST(jsonRequest("http://localhost/reject", { reason: "策略说明不足" }), profileParams(profileId)))).data?.profile).toEqual(expect.objectContaining({ status: "rejected" }));
    await agentSubmitPOST(jsonRequest("http://localhost/submit", {}), profileParams(profileId));
    expect((await readJson(await agentPublishPOST(jsonRequest("http://localhost/publish", {}), profileParams(profileId)))).data?.profile).toEqual(expect.objectContaining({ status: "published" }));

    const auditBody = await readJson(await auditGET(new Request(`http://localhost/api/hub/admin/audit-logs?targetId=${profileId}`)));
    expect(auditBody.success).toBe(true);
    expect(((auditBody.data?.items as unknown[]) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
