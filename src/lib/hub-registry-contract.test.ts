import { describe, expect, it } from "vitest";
import {
  resolveRuleImportPreset,
  resolveSkillImportPreset,
  LEGACY_RULE_ID_ALIASES,
  LEGACY_SKILL_ID_ALIASES,
} from "@/lib/hub-registry-contract";

describe("hub-registry-contract", () => {
  it("resolves rule import presets by relative path suffix", () => {
    expect(resolveRuleImportPreset("profiles/vue/06-路由规范.md")?.slug).toBe(
      "vue-routing-guidelines",
    );
    expect(resolveRuleImportPreset("/tmp/foo/common/05-API规范.md")?.registryId).toBe(
      "api-standard",
    );
  });

  it("resolves skill import presets by relative path suffix", () => {
    expect(resolveSkillImportPreset("profiles/react/create-api")?.slug).toBe("create-api-react");
    expect(resolveSkillImportPreset("/tmp/foo/profiles/vue/create-view")?.registryId).toBe(
      "create-view",
    );
  });

  it("exposes legacy alias tables used by manifest validation", () => {
    expect(LEGACY_RULE_ID_ALIASES["api-guidelines"]).toBe("api-standard");
    expect(LEGACY_SKILL_ID_ALIASES["theme-variables-react"]).toBe("theme-variables");
  });
});
