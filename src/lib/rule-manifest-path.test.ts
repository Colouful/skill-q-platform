import { describe, expect, it } from "vitest";
import { isRuleManifestPath, normalizeZipEntryPath } from "@/lib/rule-manifest-path";

describe("rule-manifest-path", () => {
  it("识别 rule.md / RULE.md / 子路径", () => {
    expect(isRuleManifestPath("RULE.md")).toBe(true);
    expect(isRuleManifestPath("pkg/rule.md")).toBe(true);
    expect(isRuleManifestPath("a/RULE.MD")).toBe(true);
  });

  it("识别 Windows 常见 RULE.md.txt", () => {
    expect(isRuleManifestPath("my-pack/RULE.md.txt")).toBe(true);
  });

  it("排除 README 与其它 md", () => {
    expect(isRuleManifestPath("README.md")).toBe(false);
    expect(isRuleManifestPath("RULE.md.bak")).toBe(false);
  });

  it("normalizeZipEntryPath 去掉 ./ 前缀", () => {
    expect(normalizeZipEntryPath("./foo/RULE.md")).toBe("foo/RULE.md");
  });
});
