import { describe, expect, it } from "vitest";
import { AssetGovernanceService } from "@/server/hub/asset-governance-service";
import { AssetVersionService } from "@/server/hub/asset-version-service";
import { createHubRepository } from "@/server/hub/repository";

function createService() {
  const repo = createHubRepository();
  return { repo, service: new AssetGovernanceService(repo), versionService: new AssetVersionService(repo) };
}

describe("AssetGovernanceService", () => {
  it("应创建 draft asset", () => {
    const { service } = createService();

    const result = service.createDraft({
      slug: "p1-draft-rule",
      name: "P1 草稿规则",
      kind: "rule",
      scope: "platform",
      tags: ["p1", "rule"],
      visibility: "public",
    });

    expect(result.asset).toEqual(
      expect.objectContaining({
        slug: "p1-draft-rule",
        name: "P1 草稿规则",
        kind: "rule",
        scope: "platform",
        status: "draft",
        tags: ["p1", "rule"],
        visibility: "public",
      }),
    );
  });

  it("slug 重复时应报 ASSET_SLUG_ALREADY_EXISTS", () => {
    const { service } = createService();
    const input = { slug: "duplicated-rule", name: "重复规则", kind: "rule", scope: "platform" };

    service.createDraft(input);

    expect(() => service.createDraft(input)).toThrow("资产 slug 已存在");
  });

  it("kind 非法时应报 INVALID_ASSET_KIND", () => {
    const { service } = createService();

    expect(() =>
      service.createDraft({
        slug: "bad-kind",
        name: "非法类型",
        kind: "manifest",
        scope: "platform",
      }),
    ).toThrow("资产类型不合法");
  });

  it("draft asset 应可更新基础信息", () => {
    const { service } = createService();
    const created = service.createDraft({ slug: "draft-update", name: "更新前", kind: "skill", scope: "team" });

    const updated = service.updateDraft(created.asset.id, {
      name: "更新后",
      description: "描述",
      tags: ["updated"],
      ownerTeamId: "team-a",
    });

    expect(updated.asset).toEqual(
      expect.objectContaining({
        name: "更新后",
        description: "描述",
        tags: ["updated"],
      }),
    );
  });

  it("published asset 不允许更新基础信息", () => {
    const { service, versionService } = createService();
    const created = service.createDraft({ slug: "published-update", name: "已发布", kind: "flow", scope: "platform" });
    const version = versionService.create(created.asset.id, { version: "1.0.0", content: "# Flow\n" });
    versionService.publish(created.asset.id, version.version.id, {});

    expect(() => service.updateDraft(created.asset.id, { name: "不允许" })).toThrow("当前资产状态不允许修改");
  });

  it("archived asset 不允许更新", () => {
    const { service } = createService();
    const created = service.createDraft({ slug: "archived-update", name: "待归档", kind: "role", scope: "platform" });

    service.archive(created.asset.id, { reason: "测试归档" });

    expect(() => service.updateDraft(created.asset.id, { name: "不允许" })).toThrow("资产已归档");
  });

  it("更新时禁止传入 content 字段", () => {
    const { service } = createService();
    const created = service.createDraft({ slug: "content-update", name: "内容字段", kind: "role", scope: "platform" });

    expect(() => service.updateDraft(created.asset.id, { content: "# 不允许\n" })).toThrow("当前资产状态不允许修改");
  });
});
