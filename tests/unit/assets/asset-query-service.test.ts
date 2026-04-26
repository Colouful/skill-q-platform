import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetQueryService } from "@/server/hub/asset-query-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { createHubRepository } from "@/server/hub/repository";

function seedQueryRepo() {
  const repo = createHubRepository();
  const governance = new AssetGovernanceService(repo);
  const versions = new AssetVersionService(repo);
  const role = governance.createDraft({
    slug: "query-planner-role",
    name: "查询规划角色",
    kind: "role",
    scope: "platform",
    description: "用于 keyword 搜索",
    tags: ["planner"],
  });
  const flow = governance.createDraft({
    slug: "query-implementation-flow",
    name: "查询实现流程",
    kind: "flow",
    scope: "team",
    ownerTeamId: "team-query",
    tags: ["flow"],
  });
  const version = versions.create(role.asset.id, { version: "1.0.0", content: "# Role\n" });
  versions.publish(role.asset.id, version.version.id, {});
  return { repo, role, flow, query: new AssetQueryService(repo) };
}

describe("AssetQueryService", () => {
  it("应返回分页列表", async () => {
    const { query } = seedQueryRepo();

    const result = await query.list(new URLSearchParams("page=1&pageSize=1"));

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 1, total: 2 });
  });

  it("keyword 应支持 slug / name / description 模糊搜索", async () => {
    const { query } = seedQueryRepo();

    expect((await query.list(new URLSearchParams("keyword=keyword"))).pagination.total).toBe(1);
    expect((await query.list(new URLSearchParams("keyword=查询规划"))).items[0].slug).toBe("query-planner-role");
    expect((await query.list(new URLSearchParams("keyword=query-implementation"))).items[0].slug).toBe(
      "query-implementation-flow",
    );
  });

  it("应按 kind 筛选", async () => {
    const { query } = seedQueryRepo();

    const result = await query.list(new URLSearchParams("kind=flow"));

    expect(result.pagination.total).toBe(1);
    expect(result.items[0].kind).toBe("flow");
  });

  it("应按 status 筛选", async () => {
    const { query } = seedQueryRepo();

    const result = await query.list(new URLSearchParams("status=published"));

    expect(result.pagination.total).toBe(1);
    expect(result.items[0].publishedVersionCount).toBe(1);
  });

  it("详情应返回版本摘要、引用和统计", async () => {
    const { query, role } = seedQueryRepo();

    const detail = await query.detail(role.asset.id);

    expect(detail.asset.slug).toBe("query-planner-role");
    expect(detail.versions[0]).not.toHaveProperty("content");
    expect(detail.stats.versionCount).toBe(1);
    expect(detail.stats.publishedVersionCount).toBe(1);
    expect(detail.manifestRefs).toEqual([]);
  });

  it("非法分页应报 INVALID_PAGINATION", async () => {
    const { query } = seedQueryRepo();

    await expect(query.list(new URLSearchParams("page=0&pageSize=20"))).rejects.toThrow("分页参数不合法");
  });
});
