import { describe, expect, it } from "vitest";
import {
  assertPublishableManifest,
  buildManifestExport,
  classifyUpgrade,
  compareSemver,
} from "@/lib/hub-manifest";

const baseManifest = {
  id: "enterprise-react-standard",
  name: "enterprise-react-standard",
  displayName: "企业级 React 标准研发方案包",
  description: "适用于 React 项目的标准方案包",
  version: "1.0.0",
  status: "published",
  techStacks: ["react"],
  ides: ["cursor"],
  scenarios: ["new-feature"],
  installPolicy: { mode: "standard" },
  compatibility: { minCliVersion: "0.1.11" },
  assets: [
    {
      kind: "skill",
      assetId: "execute-task",
      version: "1.0.0",
      required: true,
      installPath: ".agents/skills/execute-task/SKILL.md",
      checksum: "sha256-a",
      order: 2,
      riskLevel: "L1",
      contentUrl: "https://hub.example.com/assets/execute-task",
    },
    {
      kind: "rule",
      assetId: "react-coding-standard",
      version: "1.0.0",
      required: true,
      installPath: ".agents/rules/react-coding-standard.md",
      checksum: "sha256-b",
      order: 1,
      riskLevel: "L0",
      contentUrl: "https://hub.example.com/assets/react-rule",
    },
    {
      kind: "role",
      assetId: "frontend-implementer",
      version: "1.0.0",
      required: true,
      installPath: ".agents/roles/frontend-implementer.md",
      checksum: "sha256-c",
      order: 3,
      riskLevel: "L0",
    },
    {
      kind: "flow",
      assetId: "prd-to-delivery",
      version: "1.0.0",
      required: true,
      installPath: ".agents/flows/prd-to-delivery.md",
      checksum: "sha256-d",
      order: 4,
      riskLevel: "L0",
    },
  ],
};

describe("hub-manifest", () => {
  it("应校验合法 Manifest 并生成稳定 Export 结构", () => {
    const payload = buildManifestExport(baseManifest);

    expect(payload.manifest.id).toBe("enterprise-react-standard");
    expect(payload.contractVersion).toBe("1.0.0");
    expect(payload.version).toBe("1.0.0");
    expect(payload.checksum).toHaveLength(64);
    expect(payload.assets.map((item) => item.assetId).slice(0, 2)).toEqual([
      "react-coding-standard",
      "execute-task",
    ]);
    expect(JSON.stringify(payload)).not.toContain("createdAt");
  });

  it("重复资产应阻止发布", () => {
    expect(() =>
      assertPublishableManifest({
        ...baseManifest,
        assets: [baseManifest.assets[0], baseManifest.assets[0]],
      }),
    ).toThrow("重复资产");
  });

  it("非法版本号应阻止发布", () => {
    expect(() => assertPublishableManifest({ ...baseManifest, version: "1.0" })).toThrow(
      "版本必须使用",
    );
  });

  it("缺少核心资产类型应阻止发布", () => {
    expect(() =>
      assertPublishableManifest({
        ...baseManifest,
        assets: baseManifest.assets.filter((asset) => asset.kind !== "flow"),
      }),
    ).toThrow("至少包含一个 flow");
  });

  it("应按 SemVer 判断升级类型", () => {
    expect(compareSemver("1.0.0", "1.0.1")).toBeGreaterThan(0);
    expect(classifyUpgrade("1.0.0", "1.0.1")).toBe("patch");
    expect(classifyUpgrade("1.0.0", "1.1.0")).toBe("minor");
    expect(classifyUpgrade("1.0.0", "2.0.0")).toBe("major");
  });
});
