import { describe, expect, it } from "vitest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";

describe("resolveScenarioAssets", () => {
  const skillA = { slug: "create-proposal", name: "Create Proposal" };
  const skillB = { slug: "design-analysis", name: "Design Analysis" };
  const skillC = { slug: "scenario-addon", name: "Scenario Addon" };
  const ruleA = { slug: "doc-rule", name: "Doc Rule" };
  const ruleB = { slug: "api-rule", name: "API Rule" };
  const ruleC = { slug: "scenario-rule", name: "Scenario Rule" };

  const requirementAnalyst = {
    slug: "requirement-analyst",
    name: "需求解析专家",
    skillLinks: [{ skill: skillA }, { skill: skillB }],
    ruleLinks: [{ rule: ruleA }],
  };
  const frontendImplementer = {
    slug: "frontend-implementer",
    name: "前端实现专家",
    skillLinks: [{ skill: skillB }],
    ruleLinks: [{ rule: ruleB }],
  };

  it("aggregates direct and role-derived assets", () => {
    const result = resolveScenarioAssets({
      entryRole: requirementAnalyst,
      roles: [{ role: requirementAnalyst }, { role: frontendImplementer }],
      skills: [{ skill: skillC }],
      rules: [{ rule: ruleC }],
    });

    expect(result.roleSlugs).toEqual(["requirement-analyst", "frontend-implementer"]);
    expect(result.skillSlugs).toEqual(["create-proposal", "design-analysis", "scenario-addon"]);
    expect(result.ruleSlugs).toEqual(["doc-rule", "api-rule", "scenario-rule"]);
    expect(result.entryRoleSlug).toBe("requirement-analyst");
  });

  it("respects selected roles when deriving assets", () => {
    const result = resolveScenarioAssets(
      {
        entryRole: requirementAnalyst,
        roles: [{ role: requirementAnalyst }, { role: frontendImplementer }],
        skills: [{ skill: skillC }],
        rules: [{ rule: ruleC }],
      },
      { selectedRoleSlugs: ["frontend-implementer"] },
    );

    expect(result.roleSlugs).toEqual(["frontend-implementer"]);
    expect(result.skillSlugs).toEqual(["design-analysis", "scenario-addon"]);
    expect(result.ruleSlugs).toEqual(["api-rule", "scenario-rule"]);
    expect(result.entryRoleSlug).toBe("frontend-implementer");
  });

  it("supports explicit empty role selections", () => {
    const result = resolveScenarioAssets(
      {
        entryRole: requirementAnalyst,
        roles: [{ role: requirementAnalyst }, { role: frontendImplementer }],
        skills: [{ skill: skillC }],
        rules: [{ rule: ruleC }],
      },
      { selectedRoleSlugs: [] },
    );

    expect(result.roleSlugs).toEqual([]);
    expect(result.skillSlugs).toEqual(["scenario-addon"]);
    expect(result.ruleSlugs).toEqual(["scenario-rule"]);
    expect(result.entryRoleSlug).toBeNull();
  });

  it("filters profile-scoped assets before resolving manifest content", () => {
    const vueSkill = { slug: "create-view", name: "Create View", supportedProfiles: ["vue"] };
    const reactSkill = { slug: "create-api-react", name: "Create API", supportedProfiles: ["react"] };
    const sharedSkill = { slug: "using-superpowers", name: "Using Superpowers" };
    const vueRule = {
      slug: "vue-project-overview",
      name: "Vue 项目概述",
      supportedProfiles: ["vue"],
    };
    const reactRule = {
      slug: "react-project-overview",
      name: "React 项目概述",
      supportedProfiles: ["react"],
    };
    const role = {
      slug: "task-orchestrator",
      name: "任务主代理",
      supportedProfiles: ["react", "vue"],
      skillLinks: [{ skill: reactSkill }, { skill: vueSkill }],
      ruleLinks: [{ rule: reactRule }, { rule: vueRule }],
    };

    const result = resolveScenarioAssets(
      {
        entryRole: role,
        roles: [{ role }],
        skills: [{ skill: sharedSkill }],
        rules: [],
      },
      { profile: "vue" },
    );

    expect(result.roleSlugs).toEqual(["task-orchestrator"]);
    expect(result.skillSlugs).toEqual(["create-view", "using-superpowers"]);
    expect(result.ruleSlugs).toEqual(["vue-project-overview"]);
    expect(result.entryRoleSlug).toBe("task-orchestrator");
  });

  it("treats common profile assets as shared across hub profiles", () => {
    const reactCommonSkill = {
      slug: "react-shared-plan",
      name: "React Shared Plan",
      supportedProfiles: ["React.Common"],
    };
    const commonSkill = {
      slug: "delivery-checklist",
      name: "Delivery Checklist",
      supportedProfiles: ["common"],
    };
    const reactCommonRule = {
      slug: "react-shared-rule",
      name: "React Shared Rule",
      supportedProfiles: ["react.common"],
    };
    const commonRule = {
      slug: "generic-review-rule",
      name: "Generic Review Rule",
      supportedProfiles: ["common"],
    };
    const reactCommonRole = {
      slug: "task-orchestrator",
      name: "任务主代理",
      supportedProfiles: ["React.Common"],
      skillLinks: [{ skill: reactCommonSkill }],
      ruleLinks: [{ rule: reactCommonRule }],
    };
    const commonRole = {
      slug: "code-guardian",
      name: "规范守护者",
      supportedProfiles: ["common"],
      skillLinks: [{ skill: commonSkill }],
      ruleLinks: [{ rule: commonRule }],
    };
    const vueOnlyRole = {
      slug: "vue-specialist",
      name: "Vue 专家",
      supportedProfiles: ["vue"],
      skillLinks: [],
      ruleLinks: [],
    };

    const result = resolveScenarioAssets(
      {
        entryRole: reactCommonRole,
        roles: [{ role: reactCommonRole }, { role: commonRole }, { role: vueOnlyRole }],
        skills: [],
        rules: [],
      },
      { profile: "react" },
    );

    expect(result.roleSlugs).toEqual(["task-orchestrator", "code-guardian"]);
    expect(result.skillSlugs).toEqual(["react-shared-plan", "delivery-checklist"]);
    expect(result.ruleSlugs).toEqual(["react-shared-rule", "generic-review-rule"]);
    expect(result.entryRoleSlug).toBe("task-orchestrator");
  });
});
