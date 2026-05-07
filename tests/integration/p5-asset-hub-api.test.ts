import { describe, expect, it } from "vitest";
import { POST as feedbackPOST } from "@/app/api/hub/assets/feedback/route";
import { GET as detailGET } from "@/app/api/hub/assets/[slug]/detail/route";
import { GET as effectiveGET } from "@/app/api/hub/assets/[slug]/effective/route";
import { GET as packageGET } from "@/app/api/hub/assets/[slug]/package/route";
import { GET as qualityGET } from "@/app/api/hub/assets/[slug]/quality/route";
import { GET as rollbackGET } from "@/app/api/hub/assets/[slug]/rollback/route";
import { GET as searchGET } from "@/app/api/hub/assets/search/route";
import { GET as publicVersionsGET } from "@/app/api/hub/assets/[slug]/versions/route";
import { POST as forkPOST } from "@/app/api/hub/admin/assets/[assetId]/fork/route";
import { POST as overridePOST } from "@/app/api/hub/admin/assets/[assetId]/override/route";
import { POST as assetPOST } from "@/app/api/hub/admin/assets/route";
import { POST as publishPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/[versionId]/publish/route";
import { POST as versionPOST } from "@/app/api/hub/admin/assets/[assetId]/versions/route";

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

function postJson(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function params(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

function assetParams(assetId: string) {
  return { params: Promise.resolve({ assetId }) };
}

function versionParams(assetId: string, versionId: string) {
  return { params: Promise.resolve({ assetId, versionId }) };
}

function expectApiShape(body: ApiBody, success: boolean) {
  expect(Object.keys(body).sort()).toEqual(["data", "error", "requestId", "success", "timestamp"]);
  expect(body.success).toBe(success);
  if (success) {
    expect(body.error).toBeNull();
    expect(body.data).toBeTruthy();
  } else {
    expect(body.data).toBeNull();
    expect(body.error?.message).toEqual(expect.any(String));
  }
}

async function createPublishedRule(slug: string) {
  const assetBody = await readJson(
    await assetPOST(
      postJson("http://localhost/api/hub/admin/assets", {
        slug,
        name: "P5 React 规则",
        kind: "rule",
        scope: "enterprise",
        description: "P5 集成验收规则",
        tags: ["p5", "react"],
      }),
    ),
  );
  expectApiShape(assetBody, true);
  const asset = assetBody.data?.asset as Record<string, unknown>;
  const assetId = String(asset.id);

  const versionOneBody = await readJson(
    await versionPOST(
      postJson(`http://localhost/api/hub/admin/assets/${assetId}/versions`, {
        version: "1.0.0",
        content: "# P5 React Rule\n\n- 必须使用中文提示。\n",
        contentFormat: "markdown",
        compatibility: { frameworks: ["react"], adapters: ["cursor", "claudeCode"] },
        source: "skill-q-platform",
        changelog: "初始版本",
      }),
      assetParams(assetId),
    ),
  );
  expectApiShape(versionOneBody, true);
  const versionOne = versionOneBody.data?.version as Record<string, unknown>;
  const versionOneId = String(versionOne.id);
  await readJson(
    await publishPOST(
      postJson(`http://localhost/api/hub/admin/assets/${assetId}/versions/${versionOneId}/publish`, {
        publishNote: "P5 验收发布",
      }),
      versionParams(assetId, versionOneId),
    ),
  );

  const versionTwoBody = await readJson(
    await versionPOST(
      postJson(`http://localhost/api/hub/admin/assets/${assetId}/versions`, {
        version: "1.1.0",
        content: "# P5 React Rule\n\n- 必须使用中文提示。\n- 禁止上传源码。\n",
        contentFormat: "markdown",
        compatibility: { frameworks: ["react"], adapters: ["cursor", "claudeCode", "codex"] },
        source: "skill-q-platform",
        changelog: "补充隐私约束",
      }),
      assetParams(assetId),
    ),
  );
  expectApiShape(versionTwoBody, true);
  const versionTwo = versionTwoBody.data?.version as Record<string, unknown>;
  const versionTwoId = String(versionTwo.id);
  const publishBody = await readJson(
    await publishPOST(
      postJson(`http://localhost/api/hub/admin/assets/${assetId}/versions/${versionTwoId}/publish`, {
        publishNote: "P5 验收发布新版本",
      }),
      versionParams(assetId, versionTwoId),
    ),
  );
  expectApiShape(publishBody, true);
  return { assetId, slug, versionOneId, versionTwoId };
}

describe("P5 Asset Hub API", () => {
  it("应完成资产发布、搜索、安装元数据、回滚元数据、反馈与质量评分闭环", async () => {
    const slug = `p5-rule-${Date.now()}`;
    const { assetId } = await createPublishedRule(slug);

    const searchBody = await readJson(
      await searchGET(new Request(`http://localhost/api/hub/assets/search?keyword=${slug}&assetType=rule&status=active`)),
    );
    expectApiShape(searchBody, true);
    const searchItems = searchBody.data?.items as Array<Record<string, unknown>>;
    expect(searchItems[0]).toEqual(expect.objectContaining({ assetId: slug, status: "active" }));

    const detailBody = await readJson(
      await detailGET(new Request(`http://localhost/api/hub/assets/${slug}/detail`), params(slug)),
    );
    expectApiShape(detailBody, true);
    expect(detailBody.data?.asset).toEqual(expect.objectContaining({ assetId: slug, assetType: "rule" }));

    const packageBody = await readJson(
      await packageGET(new Request(`http://localhost/api/hub/assets/${slug}/package`), params(slug)),
    );
    expectApiShape(packageBody, true);
    expect(packageBody.data).toEqual(
      expect.objectContaining({
        assetId: slug,
        assetType: "rule",
        source: "skill-q-platform",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(packageBody.data?.files).toEqual([
      expect.objectContaining({
        path: expect.stringMatching(/^rules\//),
        checksum: expect.stringMatching(/^sha256:/),
      }),
    ]);
    expect(JSON.stringify(packageBody.data)).not.toContain("/Users/");
    expect(JSON.stringify(packageBody.data)).not.toContain("rawPrompt");
    expect(JSON.stringify(packageBody.data)).not.toContain("sourceCode");

    const versionsBody = await readJson(
      await publicVersionsGET(new Request(`http://localhost/api/hub/assets/${slug}/versions`), params(slug)),
    );
    expectApiShape(versionsBody, true);
    expect((versionsBody.data?.items as unknown[]).length).toBeGreaterThanOrEqual(2);

    const rollbackBody = await readJson(
      await rollbackGET(new Request(`http://localhost/api/hub/assets/${slug}/rollback?version=1.1.0`), params(slug)),
    );
    expectApiShape(rollbackBody, true);
    expect(rollbackBody.data?.currentVersion).toBe("1.1.0");
    expect((rollbackBody.data?.candidates as Array<Record<string, unknown>>)[0]).toEqual(
      expect.objectContaining({ fromVersion: "1.1.0", toVersion: "1.0.0" }),
    );

    const feedbackBody = await readJson(
      await feedbackPOST(
        postJson("http://localhost/api/hub/assets/feedback", {
          feedbackId: `fb-${slug}`,
          assetId: slug,
          assetType: "rule",
          runId: `run-${slug}`,
          projectId: "project-p5",
          status: "success",
          metrics: {
            adopted: true,
            hookBlocked: false,
            testPassed: true,
            repairSucceeded: true,
            manualIntervention: false,
          },
          timestamp: new Date().toISOString(),
        }),
      ),
    );
    expectApiShape(feedbackBody, true);
    expect(feedbackBody.data?.metrics).toEqual(
      expect.objectContaining({
        usageCount: 1,
        successRate: 1,
        failureRate: 0,
        adoptionRate: 1,
      }),
    );

    const qualityBody = await readJson(
      await qualityGET(new Request(`http://localhost/api/hub/assets/${slug}/quality`), params(slug)),
    );
    expectApiShape(qualityBody, true);
    expect(Number(qualityBody.data?.qualityScore)).toBeGreaterThan(0);

    const forkBody = await readJson(
      await forkPOST(
        postJson(`http://localhost/api/hub/admin/assets/${assetId}/fork`, {
          slug: `${slug}-team`,
          name: "团队派生规则",
          scope: "team",
          ownerTeamId: "team-a",
          overrideFields: { description: "团队覆盖说明", metadata: { team: "team-a" } },
        }),
        assetParams(assetId),
      ),
    );
    expectApiShape(forkBody, true);
    const forked = forkBody.data?.asset as Record<string, unknown>;
    expect(forked.parentAssetId).toBe(assetId);

    const overrideBody = await readJson(
      await overridePOST(
        postJson(`http://localhost/api/hub/admin/assets/${forked.id}/override`, {
          overrideFields: { description: "项目最终覆盖说明" },
        }),
        assetParams(String(forked.id)),
      ),
    );
    expectApiShape(overrideBody, true);
    expect(overrideBody.data?.effective).toEqual(
      expect.objectContaining({
        description: "项目最终覆盖说明",
      }),
    );

    const effectiveBody = await readJson(
      await effectiveGET(new Request(`http://localhost/api/hub/assets/${forked.slug}/effective`), params(String(forked.slug))),
    );
    expectApiShape(effectiveBody, true);
    expect(effectiveBody.data?.inheritanceChain).toEqual([
      expect.objectContaining({ slug }),
      expect.objectContaining({ slug: forked.slug }),
    ]);
  });

  it("应拒绝反馈中的敏感字段和 Override 核心字段", async () => {
    const slug = `p5-sensitive-${Date.now()}`;
    const { assetId } = await createPublishedRule(slug);

    const feedbackBody = await readJson(
      await feedbackPOST(
        postJson("http://localhost/api/hub/assets/feedback", {
          assetId: slug,
          assetType: "rule",
          runId: "run-sensitive",
          projectId: "project-sensitive",
          status: "success",
          rawPrompt: "不允许",
          metrics: { adopted: true },
        }),
      ),
    );
    expectApiShape(feedbackBody, false);
    expect(feedbackBody.error?.code).toBe("PRIVACY_VIOLATION");

    const forkBody = await readJson(
      await forkPOST(
        postJson(`http://localhost/api/hub/admin/assets/${assetId}/fork`, {
          slug: `${slug}-team`,
          scope: "team",
          overrideFields: { checksum: "sha256:bad" },
        }),
        assetParams(assetId),
      ),
    );
    expectApiShape(forkBody, false);
    expect(forkBody.error?.code).toBe("ASSET_CREATE_INVALID");
  });
});
