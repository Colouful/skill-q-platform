import { describe, expect, it } from "vitest";
import { buildRoleTemplatePrompt } from "@/lib/role-template-prompt";

describe("role template prompt", () => {
  it("covers admin fields and markdown role structure", () => {
    const prompt = buildRoleTemplatePrompt({
      domainSlugs: ["engineering", "delivery"],
      skillSlugs: ["create-component", "theme-variables"],
      ruleSlugs: ["ui-guard"],
    });

    expect(prompt).toContain("字段核对清单");
    expect(prompt).toContain('"slug": "xxx-expert"');
    expect(prompt).toContain('"skillSlugs": ["XXX-skill"]');
    expect(prompt).toContain("preferred_skills:");
    expect(prompt).toContain("## 角色定位");
    expect(prompt).toContain("## 交接说明");
    expect(prompt).toContain("- domains: engineering / delivery");
    expect(prompt).toContain("- skills: create-component / theme-variables");
    expect(prompt).toContain("- rules: ui-guard");
  });

  it("falls back to placeholders when no reference slugs are available", () => {
    const prompt = buildRoleTemplatePrompt({
      domainSlugs: [],
      skillSlugs: [],
      ruleSlugs: [],
    });

    expect(prompt).toContain("- domains: XXX-domain");
    expect(prompt).toContain("- skills: XXX-skill");
    expect(prompt).toContain("- rules: XXX-rule");
  });
});
