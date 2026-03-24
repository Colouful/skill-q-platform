import { describe, expect, it } from "vitest";
import { validateRulePackage } from "@/lib/rule-package-validator";

describe("validateRulePackage", () => {
  it("无文件时通过", () => {
    const r = validateRulePackage(undefined);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("含 RULE.md 与规则文件时通过", () => {
    const r = validateRulePackage([
      { name: "RULE.md", path: "RULE.md", content: "---\nname: x\n---\n" },
      { name: "a.json", path: "rules/a.json", content: "{}" },
    ]);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("RULE.md.txt 视为有效主文件", () => {
    const r = validateRulePackage([
      { name: "RULE.md.txt", path: "RULE.md.txt", content: "x" },
      { name: "a.json", path: "a.json", content: "{}" },
    ]);
    expect(r.ok).toBe(true);
  });

  it("有文件但缺少 RULE.md 时报错", () => {
    const r = validateRulePackage([{ name: "a.json", path: "a.json", content: "{}" }]);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("RULE.md"))).toBe(true);
  });

  it("仅有 RULE.md 时警告无规则文件但仍可提交", () => {
    const r = validateRulePackage([
      { name: "RULE.md", path: "pkg/RULE.md", content: "hi" },
    ]);
    expect(r.ok).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
