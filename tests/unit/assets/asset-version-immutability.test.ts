import { describe, expect, it } from "vitest";
import { AssetService } from "@/server/hub/asset-service";
import { createHubRepository } from "@/server/hub/repository";

describe("AssetVersion immutable 规则", () => {
  it("published AssetVersion 应 immutable=true 且不可直接修改 content", () => {
    const repo = createHubRepository();
    const service = new AssetService(repo);
    service.createDraftAsset({ slug: "published-rule", name: "已发布规则", kind: "rule" });
    const version = service.createVersion({
      assetSlug: "published-rule",
      version: "1.0.0",
      content: "# Rule\n",
      status: "published",
    });

    expect(version.immutable).toBe(true);
    expect(version.checksum).toMatch(/^sha256:/);
    expect(() =>
      service.updateVersionContent({
        assetSlug: "published-rule",
        version: "1.0.0",
        content: "# Changed\n",
      }),
    ).toThrow("已发布资产版本不可修改 content");
  });

  it("draft AssetVersion 应可修改 content 并重算 checksum", () => {
    const repo = createHubRepository();
    const service = new AssetService(repo);
    service.createDraftAsset({ slug: "draft-skill", name: "草稿技能", kind: "skill" });
    const version = service.createVersion({
      assetSlug: "draft-skill",
      version: "0.1.0",
      content: "# Draft\n",
    });
    const oldChecksum = version.checksum;

    const updated = service.updateVersionContent({
      assetSlug: "draft-skill",
      version: "0.1.0",
      content: "# Draft Changed\n",
    });

    expect(updated.content).toBe("# Draft Changed\n");
    expect(updated.checksum).toMatch(/^sha256:/);
    expect(updated.checksum).not.toBe(oldChecksum);
    expect(updated.contentSize).toBe("# Draft Changed\n".length);
  });

  it("修改 published 内容必须创建新版本", () => {
    const repo = createHubRepository();
    const service = new AssetService(repo);
    service.createDraftAsset({ slug: "versioned-flow", name: "版本化流程", kind: "flow" });
    const published = service.createVersion({
      assetSlug: "versioned-flow",
      version: "1.0.0",
      content: "# Flow v1\n",
      status: "published",
    });
    const next = service.createVersion({
      assetSlug: "versioned-flow",
      version: "1.1.0",
      content: "# Flow v1.1\n",
      status: "published",
    });

    expect(published.version).toBe("1.0.0");
    expect(next.version).toBe("1.1.0");
    expect(next.checksum).not.toBe(published.checksum);
    expect(repo.assetVersions.filter((item) => item.assetId === published.assetId)).toHaveLength(2);
  });
});
