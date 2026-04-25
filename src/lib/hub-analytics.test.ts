import { describe, expect, it } from "vitest";
import { buildHubAnalytics } from "@/lib/hub-analytics";

describe("hub-analytics", () => {
  it("应按 Manifest 和 Asset 聚合真实运行效果", () => {
    const result = buildHubAnalytics({
      manifests: [
        {
          manifestId: "enterprise-react-standard",
          displayName: "企业级 React 标准研发方案包",
          status: "published",
        },
      ],
      assets: [
        {
          kind: "skill",
          assetId: "execute-task",
          displayName: "执行任务",
          riskLevel: "L1",
          status: "published",
        },
        {
          kind: "skill",
          assetId: "danger-skill",
          displayName: "高风险技能",
          riskLevel: "L3",
          status: "published",
        },
      ],
      installs: [
        {
          projectName: "crm-admin",
          manifestId: "enterprise-react-standard",
          manifestVersion: "1.0.0",
          status: "success",
        },
        {
          projectName: "risk-console",
          manifestId: "enterprise-react-standard",
          manifestVersion: "1.0.0",
          status: "success",
        },
      ],
      runtimes: [
        {
          projectName: "crm-admin",
          manifestId: "enterprise-react-standard",
          manifestVersion: "1.0.0",
          runId: "run-1",
          status: "success",
          usedAssets: [{ kind: "skill", assetId: "execute-task", version: "1.0.0" }],
          durationMs: 1000,
          createdAt: "2026-04-24T01:00:00.000Z",
        },
        {
          projectName: "risk-console",
          manifestId: "enterprise-react-standard",
          manifestVersion: "1.0.0",
          runId: "run-2",
          status: "failed",
          failedReason: "测试缺失",
          usedAssets: [{ kind: "skill", assetId: "execute-task", version: "1.0.0" }],
          durationMs: 3000,
          createdAt: "2026-04-24T02:00:00.000Z",
        },
      ],
    });

    expect(result.summary.installedProjects).toBe(2);
    expect(result.summary.runCount).toBe(2);
    expect(result.summary.successRate).toBe(0.5);
    expect(result.summary.avgDurationMs).toBe(2000);
    expect(result.summary.highRiskAssetCount).toBe(1);
    expect(result.manifests[0]).toMatchObject({
      manifestId: "enterprise-react-standard",
      installedProjects: 2,
      runCount: 2,
      failedRunCount: 1,
      recommendationGrade: "D",
    });
    expect(result.manifests[0]?.commonFailureReasons).toEqual([{ reason: "测试缺失", count: 1 }]);
    expect(result.assets[0]).toMatchObject({
      assetId: "execute-task",
      projectCoverage: 2,
      runCount: 2,
      successRate: 0.5,
    });
    expect(result.governance.riskyAssets).toEqual([
      { kind: "skill", assetId: "danger-skill", riskLevel: "L3" },
    ]);
  });

  it("未运行资产应返回 N/A 推荐等级", () => {
    const result = buildHubAnalytics({
      manifests: [{ manifestId: "empty", displayName: "空方案", status: "published" }],
      assets: [{ kind: "rule", assetId: "api-rule", riskLevel: "L0", status: "published" }],
      installs: [],
      runtimes: [],
    });

    expect(result.manifests[0]?.recommendationGrade).toBe("N/A");
    expect(result.assets[0]?.recommendationGrade).toBe("N/A");
    expect(result.governance.uninstalledPublishedManifests).toEqual(["empty"]);
  });
});
