export const LEGACY_SKILL_ID_ALIASES: Record<string, string> = {
  "create-api-react": "create-api",
  "create-api-vue": "create-api",
  "create-component-react": "create-component",
  "create-component-vue": "create-component",
  "create-route-react": "create-route",
  "create-route-vue": "create-route",
  "create-store-react": "create-store",
  "create-store-vue": "create-store",
  "theme-variables-react": "theme-variables",
  "theme-variables-vue": "theme-variables",
};

export const REGISTRY_LIKE_ID = /^[a-z0-9._-]+$/;

export const LEGACY_RULE_ID_ALIASES: Record<string, string> = {
  "react-project-overview": "project-overview",
  "vue-project-overview": "project-overview",
  "react-project-structure": "project-structure",
  "vue-project-structure": "project-structure",
  "react-component-guidelines": "component-standard",
  "vue-component-guidelines": "component-standard",
  "react-routing-guidelines": "route-standard",
  "vue-routing-guidelines": "route-standard",
  "react-state-management": "store-standard",
  "vue-state-management": "store-standard",
  "react-style-guidelines": "style-standard",
  "vue-style-guidelines": "style-standard",
  "api-guidelines": "api-standard",
  "coding-guidelines": "coding-standard",
  "general-constraints": "generic-constraints",
  "documentation-guidelines": "doc-standard",
  "testing-guidelines": "test-standard",
  "superpowers-execution-guidelines": "superpowers-standard",
  "code-formatting-and-checks": "format-check-standard",
  "audit-reporting-guidelines": "audit-report-standard",
};

export type RuleImportPreset = {
  slug: string;
  registryId: string;
  tags: string[];
  categorySlug?: string;
};

export type SkillImportPreset = {
  slug: string;
  registryId: string;
};

export const RULE_IMPORT_PRESETS: Record<string, RuleImportPreset> = {
  "common/02-编码规范.md": {
    slug: "coding-standard",
    registryId: "coding-standard",
    tags: ["TypeScript", "JavaScript", "命名规范", "代码实现"],
  },
  "common/05-API规范.md": {
    slug: "api-standard",
    registryId: "api-standard",
    tags: ["API", "接口规范", "前后端协作", "代码实现"],
  },
  "common/08-通用约束.md": {
    slug: "generic-constraints",
    registryId: "generic-constraints",
    tags: ["通用约束", "工程规范", "ai-spec", "协作"],
  },
  "common/10-文档规范.md": {
    slug: "doc-standard",
    registryId: "doc-standard",
    tags: ["文档规范", "技术写作", "协作", "ai-spec"],
  },
  "common/11-测试规范.md": {
    slug: "test-standard",
    registryId: "test-standard",
    tags: ["测试", "Vitest", "质量保障", "代码实现"],
  },
  "common/12-Superpowers执行规范.md": {
    slug: "superpowers-standard",
    registryId: "superpowers-standard",
    tags: ["Superpowers", "任务执行", "工作流", "ai-spec"],
    categorySlug: "workflow-templates",
  },
  "common/13-代码格式化与检查.md": {
    slug: "format-check-standard",
    registryId: "format-check-standard",
    tags: ["ESLint", "Prettier", "代码检查", "工程规范"],
  },
  "common/14-审计汇报规范.md": {
    slug: "audit-report-standard",
    registryId: "audit-report-standard",
    tags: ["审计汇报", "质量保障", "工作流", "ai-spec"],
  },
  "profiles/react/01-项目概述.md": {
    slug: "react-project-overview",
    registryId: "project-overview",
    tags: ["React", "项目概述", "项目初始化", "ai-spec"],
  },
  "profiles/react/03-项目结构.md": {
    slug: "react-project-structure",
    registryId: "project-structure",
    tags: ["React", "项目结构", "工程规范", "ai-spec"],
  },
  "profiles/react/04-组件规范.md": {
    slug: "react-component-guidelines",
    registryId: "component-standard",
    tags: ["React", "组件开发", "Hooks", "代码实现"],
  },
  "profiles/react/06-路由规范.md": {
    slug: "react-routing-guidelines",
    registryId: "route-standard",
    tags: ["React", "路由", "页面开发", "代码实现"],
    categorySlug: "routing-rules",
  },
  "profiles/react/07-状态管理.md": {
    slug: "react-state-management",
    registryId: "store-standard",
    tags: ["React", "状态管理", "Redux", "Zustand"],
  },
  "profiles/react/09-样式规范.md": {
    slug: "react-style-guidelines",
    registryId: "style-standard",
    tags: ["React", "CSS", "样式规范", "主题变量"],
  },
  "profiles/vue/01-项目概述.md": {
    slug: "vue-project-overview",
    registryId: "project-overview",
    tags: ["Vue", "项目概述", "项目初始化", "ai-spec"],
  },
  "profiles/vue/03-项目结构.md": {
    slug: "vue-project-structure",
    registryId: "project-structure",
    tags: ["Vue", "项目结构", "工程规范", "ai-spec"],
  },
  "profiles/vue/04-组件规范.md": {
    slug: "vue-component-guidelines",
    registryId: "component-standard",
    tags: ["Vue", "组件开发", "SFC", "代码实现"],
  },
  "profiles/vue/06-路由规范.md": {
    slug: "vue-routing-guidelines",
    registryId: "route-standard",
    tags: ["Vue", "路由", "页面开发", "代码实现"],
    categorySlug: "routing-rules",
  },
  "profiles/vue/07-状态管理.md": {
    slug: "vue-state-management",
    registryId: "store-standard",
    tags: ["Vue", "状态管理", "Pinia", "代码实现"],
  },
  "profiles/vue/09-样式规范.md": {
    slug: "vue-style-guidelines",
    registryId: "style-standard",
    tags: ["Vue", "CSS", "样式规范", "主题变量"],
  },
};

export const SKILL_IMPORT_PRESETS: Record<string, SkillImportPreset> = {
  "common/archive-change": {
    slug: "archive-change",
    registryId: "archive-change",
  },
  "common/create-proposal": {
    slug: "create-proposal",
    registryId: "create-proposal",
  },
  "common/create-test": {
    slug: "create-test",
    registryId: "create-test",
  },
  "common/design-analysis": {
    slug: "design-analysis",
    registryId: "design-analysis",
  },
  "common/execute-task": {
    slug: "execute-task",
    registryId: "execute-task",
  },
  "common/find-skills": {
    slug: "find-skills",
    registryId: "find-skills",
  },
  "common/project-init": {
    slug: "project-init",
    registryId: "project-init",
  },
  "common/skill-creator": {
    slug: "skill-creator",
    registryId: "skill-creator",
  },
  "common/ui-verification": {
    slug: "ui-verification",
    registryId: "ui-verification",
  },
  "common/using-superpowers": {
    slug: "using-superpowers",
    registryId: "using-superpowers",
  },
  "common/web-design-guidelines": {
    slug: "web-design-guidelines",
    registryId: "web-design-guidelines",
  },
  "profiles/react/create-api": {
    slug: "create-api-react",
    registryId: "create-api",
  },
  "profiles/react/create-component": {
    slug: "create-component-react",
    registryId: "create-component",
  },
  "profiles/react/create-route": {
    slug: "create-route-react",
    registryId: "create-route",
  },
  "profiles/react/create-store": {
    slug: "create-store-react",
    registryId: "create-store",
  },
  "profiles/react/theme-variables": {
    slug: "theme-variables-react",
    registryId: "theme-variables",
  },
  "profiles/react/vercel-composition-patterns": {
    slug: "vercel-composition-patterns",
    registryId: "vercel-composition-patterns",
  },
  "profiles/react/vercel-react-best-practices": {
    slug: "vercel-react-best-practices",
    registryId: "vercel-react-best-practices",
  },
  "profiles/vue/create-api": {
    slug: "create-api-vue",
    registryId: "create-api",
  },
  "profiles/vue/create-component": {
    slug: "create-component-vue",
    registryId: "create-component",
  },
  "profiles/vue/create-route": {
    slug: "create-route-vue",
    registryId: "create-route",
  },
  "profiles/vue/create-store": {
    slug: "create-store-vue",
    registryId: "create-store",
  },
  "profiles/vue/create-view": {
    slug: "create-view",
    registryId: "create-view",
  },
  "profiles/vue/theme-variables": {
    slug: "theme-variables-vue",
    registryId: "theme-variables",
  },
  "profiles/vue/vue-best-practices": {
    slug: "vue-best-practices",
    registryId: "vue-best-practices",
  },
};

function normalizePathKey(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").trim();
}

function resolveBySuffix<T>(value: string, table: Record<string, T>): T | null {
  const normalized = normalizePathKey(value);
  if (!normalized) return null;
  if (table[normalized]) return table[normalized]!;
  for (const [key, preset] of Object.entries(table)) {
    if (normalized.endsWith(`/${key}`)) {
      return preset;
    }
  }
  return null;
}

export function resolveRuleImportPreset(relativePath: string): RuleImportPreset | null {
  return resolveBySuffix(relativePath, RULE_IMPORT_PRESETS);
}

export function resolveSkillImportPreset(relativePath: string): SkillImportPreset | null {
  return resolveBySuffix(relativePath, SKILL_IMPORT_PRESETS);
}

export function normalizeRegistryLikeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase() || "";
  if (!trimmed) return null;
  return REGISTRY_LIKE_ID.test(trimmed) ? trimmed : null;
}
