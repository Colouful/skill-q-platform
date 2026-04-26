import { describe, expect, it } from "vitest";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestQueryService } from "@/server/hub/manifest-query-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";

function seedQueryRepo() {
  const repo = createHubRepository();
  const governance = new ManifestGovernanceService(repo);
  const versions = new ManifestVersionService(repo);
  const react = governance.createDraft({
    slug: "query-react-manifest",
    name: "查询 React Manifest",
    scope: "platform",
    description: "用于 keyword 搜索",
    tags: ["frontend"],
    techStacks: ["react"],
    projectKinds: ["web"],
  });
  const node = governance.createDraft({
    slug: "query-node-manifest",
    name: "查询 Node Manifest",
    scope: "team",
    ownerTeamId: "team-query",
    tags: ["backend"],
    techStacks: ["node"],
    projectKinds: ["server"],
  });
  const version = versions.create(react.manifest.id, { version: "1.0.0" });
  repo.manifestVersions.find((item) => item.id === version.version.id)!.status = "published";
  repo.manifests.find((item) => item.id === react.manifest.id)!.status = "published";
  return { repo, react, node, query: new ManifestQueryService(repo) };
}

describe("ManifestQueryService", () => {
  it("应返回分页列表", async () => {
    const { query } = seedQueryRepo();

    const result = await query.list(new URLSearchParams("page=1&pageSize=1"));

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 1, total: 2 });
  });

  it("keyword 应支持 slug / name / description 模糊搜索", async () => {
    const { query } = seedQueryRepo();

    expect((await query.list(new URLSearchParams("keyword=keyword"))).pagination.total).toBe(1);
    expect((await query.list(new URLSearchParams("keyword=查询 React"))).items[0].slug).toBe("query-react-manifest");
    expect((await query.list(new URLSearchParams("keyword=query-node"))).items[0].slug).toBe("query-node-manifest");
  });

  it("应按 status 筛选", async () => {
    const { query } = seedQueryRepo();

    const result = await query.list(new URLSearchParams("status=published"));

    expect(result.pagination.total).toBe(1);
    expect(result.items[0].publishedVersionCount).toBe(1);
  });

  it("详情应返回版本摘要和绑定摘要", async () => {
    const { query, react } = seedQueryRepo();

    const detail = await query.detail(react.manifest.id);

    expect(detail.manifest.slug).toBe("query-react-manifest");
    expect(detail.versions[0]).toEqual(expect.objectContaining({ version: "1.0.0" }));
    expect(detail.assetBindings).toEqual([]);
    expect(detail.stats.versionCount).toBe(1);
  });
});
