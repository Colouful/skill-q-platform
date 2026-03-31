/** Skill/Rule 的 slug 在路径中须编码，避免中文等非 ASCII 在网关/客户端下与路由不一致导致 404 */

export function skillPath(slug: string, suffix = ""): string {
  return `/skills/${encodeURIComponent(slug)}${suffix}`;
}

export function rulePath(slug: string, suffix = ""): string {
  return `/rules/${encodeURIComponent(slug)}${suffix}`;
}

export function apiSkillPath(slug: string, suffix = ""): string {
  return `/api/skills/${encodeURIComponent(slug)}${suffix}`;
}

export function apiRulePath(slug: string, suffix = ""): string {
  return `/api/rules/${encodeURIComponent(slug)}${suffix}`;
}

export function rolePath(slug: string, suffix = ""): string {
  return `/roles/${encodeURIComponent(slug)}${suffix}`;
}

export function scenarioPath(slug: string, suffix = ""): string {
  return `/scenarios/${encodeURIComponent(slug)}${suffix}`;
}

export function apiRolePath(slug: string, suffix = ""): string {
  return `/api/roles/${encodeURIComponent(slug)}${suffix}`;
}

export function apiScenarioPath(slug: string, suffix = ""): string {
  return `/api/scenarios/${encodeURIComponent(slug)}${suffix}`;
}
