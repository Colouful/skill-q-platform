import { describe, expect, it } from "vitest";
import {
  extractRegistrySnapshot,
  inferAssetProfiles,
  inferRuleRegistryId,
  inferSkillRegistryId,
  renderRoleMarkdown,
} from "@/lib/br-ai-spec-export";

describe("br-ai-spec export helpers", () => {
  it("优先使用显式 supportedProfiles", () => {
    const profiles = inferAssetProfiles({
      explicitProfiles: ["react", "vue"],
      hubSlug: "create-api-react",
      hubName: "React API创建与维护",
      knownProfiles: ["react", "vue", "nest"],
    });

    expect(profiles).toEqual(["react", "vue"]);
  });

  it("无显式 profile 时可从 slug/name 推断", () => {
    const profiles = inferAssetProfiles({
      hubSlug: "react-project-structure",
      hubName: "React项目结构",
      knownProfiles: ["react", "vue", "nest"],
    });

    expect(profiles).toEqual(["react"]);
  });

  it("Skill registry id 优先取 SKILL.md frontmatter name", () => {
    const registryId = inferSkillRegistryId({
      hubSlug: "create-api-react",
      hubName: "React API创建与维护",
      profiles: ["react"],
      knownProfiles: ["react", "vue"],
      manifestContent: `---
name: create-api
description: xxx
---

# 创建与维护 API
`,
    });

    expect(registryId).toBe("create-api");
  });

  it("Rule registry id 可从 profile 前缀 slug 还原逻辑 id", () => {
    const registryId = inferRuleRegistryId({
      hubSlug: "react-project-structure",
      hubName: "React项目结构",
      profiles: ["react"],
      knownProfiles: ["react", "vue"],
      manifestContent: `---
description: 项目结构规范
---

# 项目结构
`,
    });

    expect(registryId).toBe("project-structure");
  });

  it("角色 Markdown 导出包含 frontmatter 和标准章节", () => {
    const content = renderRoleMarkdown({
      slug: "frontend-implementer",
      name: "前端实现专家",
      status: "active",
      description: "负责页面与交互实现。",
      longDescription: "负责把需求转成前端交付物。",
      domains: ["engineering", "delivery"],
      triggers: ["task-ready"],
      preferredSkills: ["create-api", "create-component"],
      reads: ["context/PROJECT.md"],
      writes: ["src/pages/**"],
      handoffTo: ["code-guardian"],
      rolePositioning: "承担页面开发与联调。",
      workingPrinciples: ["先对齐落点", "避免扩 scope"],
      requiredSteps: ["读取任务", "实现功能"],
      executionContract: "遵守项目规则。",
      outputStandard: "输出可验收代码。",
      prohibitedActions: ["跳过校验"],
      handoffNotes: "完成后交给 code-guardian。",
    });

    expect(content).toContain('id: "frontend-implementer"');
    expect(content).toContain("preferred_skills:");
    expect(content).toContain('  - "create-api"');
    expect(content).toContain("## 角色定位");
    expect(content).toContain("## 必做步骤");
    expect(content).toContain("1. 读取任务");
    expect(content).toContain("## 交接说明");
  });

  it("可从导出 bundle 中提取 registry snapshot", () => {
    const snapshot = extractRegistrySnapshot({
      manifest: {
        profile: "vue",
        ides: ["cursor"],
        scenario_packages: ["prd-to-delivery"],
        roles: ["task-orchestrator"],
        skills: ["create-proposal"],
        rules: ["api-standard"],
        entry_role: "task-orchestrator",
      },
      warnings: [],
      report: {
        generatedAt: "2026-04-13T00:00:00.000Z",
        manifest: {
          profile: "vue",
          ides: ["cursor"],
          scenario_packages: ["prd-to-delivery"],
          roles: ["task-orchestrator"],
          skills: ["create-proposal"],
          rules: ["api-standard"],
          entry_role: "task-orchestrator",
        },
        warnings: [],
        assets: {
          roles: [],
          skills: [],
          rules: [],
          scenarios: [],
        },
      },
      files: [
        { path: ".agents/registry/profiles.json", content: JSON.stringify({ version: 1, profiles: { vue: {} } }) },
        { path: ".agents/registry/skills.json", content: JSON.stringify({ version: 1, skills: { "create-proposal": {} } }) },
        { path: ".agents/registry/rules.json", content: JSON.stringify({ version: 1, rules: { "api-standard": {} } }) },
        { path: ".agents/registry/roles.json", content: JSON.stringify({ version: 1, roles: { "task-orchestrator": {} } }) },
        { path: ".agents/registry/flows.json", content: JSON.stringify({ version: 1, flows: { "prd-to-delivery": {} } }) },
        { path: ".agents/registry/scenario-packages.json", content: JSON.stringify({ version: 1, scenario_packages: { "prd-to-delivery": {} } }) },
      ],
    });

    expect(snapshot.profiles).toMatchObject({ version: 1 });
    expect(snapshot.skills).toMatchObject({ version: 1 });
    expect(snapshot.rules).toMatchObject({ version: 1 });
    expect(snapshot.roles).toMatchObject({ version: 1 });
    expect(snapshot.flows).toMatchObject({ version: 1 });
    expect(snapshot.scenario_packages).toMatchObject({ version: 1 });
  });
});
