import { describe, expect, it } from "vitest";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";

describe("ManifestGovernanceService", () => {
  it("应创建 draft manifest", () => {
    const repo = createHubRepository();
    const service = new ManifestGovernanceService(repo);

    const result = service.createDraft({
      slug: "p2-draft-manifest",
      name: "P2 草稿 Manifest",
      scope: "platform",
      tags: ["p2"],
      techStacks: ["nextjs"],
      projectKinds: ["frontend"],
      recommendedFor: ["web"],
    });

    expect(result.manifest).toEqual(
      expect.objectContaining({
        slug: "p2-draft-manifest",
        name: "P2 草稿 Manifest",
        status: "draft",
        tags: ["p2"],
        techStacks: ["nextjs"],
      }),
    );
  });

  it("slug 重复时应报 MANIFEST_SLUG_ALREADY_EXISTS", () => {
    const repo = createHubRepository();
    const service = new ManifestGovernanceService(repo);
    const input = { slug: "duplicated-manifest", name: "重复 Manifest", scope: "platform" };

    service.createDraft(input);

    expect(() => service.createDraft(input)).toThrow("Manifest slug 已存在");
  });

  it("draft manifest 应可更新基础信息", () => {
    const repo = createHubRepository();
    const service = new ManifestGovernanceService(repo);
    const created = service.createDraft({ slug: "draft-manifest-update", name: "更新前", scope: "platform" });

    const updated = service.updateDraft(created.manifest.id, {
      name: "更新后",
      description: "描述",
      tags: ["updated"],
      ownerTeamId: "team-a",
    });

    expect(updated.manifest).toEqual(
      expect.objectContaining({
        name: "更新后",
        description: "描述",
        tags: ["updated"],
      }),
    );
  });

  it("published manifest 不允许更新基础信息", () => {
    const repo = createHubRepository();
    const service = new ManifestGovernanceService(repo);
    const versionService = new ManifestVersionService(repo);
    const created = service.createDraft({ slug: "published-manifest-update", name: "已发布", scope: "platform" });
    const version = versionService.create(created.manifest.id, { version: "1.0.0" });
    repo.manifestAssets.push({
      id: "binding",
      manifestVersionId: version.version.id,
      assetId: "asset",
      assetVersionId: "asset-version",
      kind: "role",
      required: true,
      loadWhen: [],
      order: 1,
    });
    repo.manifestVersions.find((item) => item.id === version.version.id)!.status = "published";
    repo.manifests.find((item) => item.id === created.manifest.id)!.status = "published";

    expect(() => service.updateDraft(created.manifest.id, { name: "不允许" })).toThrow("当前 Manifest 状态不允许修改");
  });

  it("archived manifest 不允许更新", () => {
    const repo = createHubRepository();
    const service = new ManifestGovernanceService(repo);
    const created = service.createDraft({ slug: "archived-manifest-update", name: "归档", scope: "platform" });

    service.archive(created.manifest.id, { reason: "测试归档" });

    expect(() => service.updateDraft(created.manifest.id, { name: "不允许" })).toThrow("Manifest 已归档");
  });
});
