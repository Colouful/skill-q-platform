import { assertNoSensitivePayload } from "./privacy-guard";
import { safeJsonHash } from "./checksum";
import { AGENT_PROFILE_ERROR } from "./agent-profile-governance-errors";
import { HUB_SCOPES, HUB_STATUSES, type HubAgentProfile, type HubAgentProfileContent, type HubScope, type HubStatus } from "./types";

export const AGENT_EXECUTORS = ["cursor", "codex", "claude-code"] as const;
export const AGENT_REASONING_EFFORTS = ["low", "medium", "high", "ultra", "xhigh"] as const;
export const REQUIRED_DENIED_TOOLS = ["upload-source", "deploy", "push", "merge"] as const;

export type AgentProfileSecurityIssue = {
  code: string;
  message: string;
  suggestion: string;
};

type Executor = (typeof AGENT_EXECUTORS)[number];

export function assertSafeAgentProfilePayload(input: unknown) {
  assertNoSensitivePayload(input);
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

export function normalizeScope(value: unknown): HubScope {
  const scope = String(value ?? "platform");
  if (!HUB_SCOPES.includes(scope as HubScope)) throw AGENT_PROFILE_ERROR.createInvalid("Agent Profile scope 不合法");
  return scope as HubScope;
}

export function normalizeStatus(value: string): HubStatus {
  if (!HUB_STATUSES.includes(value as HubStatus)) throw AGENT_PROFILE_ERROR.invalidStatus();
  return value as HubStatus;
}

export function normalizeExecutor(value: unknown): Executor {
  const executor = String(value ?? "cursor");
  if (!AGENT_EXECUTORS.includes(executor as Executor)) throw AGENT_PROFILE_ERROR.invalidExecutor();
  return executor as Executor;
}

export function normalizeAgentProfileContent(input: unknown, fallback: { slug: string; name: string }) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw AGENT_PROFILE_ERROR.contentRequired();
  assertSafeAgentProfilePayload(input);
  const record = input as Record<string, unknown>;
  const contextScope = record.contextScope && typeof record.contextScope === "object" && !Array.isArray(record.contextScope)
    ? (record.contextScope as Record<string, unknown>)
    : {};
  const modelPolicy = record.modelPolicy && typeof record.modelPolicy === "object" && !Array.isArray(record.modelPolicy)
    ? (record.modelPolicy as Record<string, unknown>)
    : {};
  const approvalPolicy = record.approvalPolicy && typeof record.approvalPolicy === "object" && !Array.isArray(record.approvalPolicy)
    ? (record.approvalPolicy as Record<string, unknown>)
    : {};
  const outputContract = record.outputContract && typeof record.outputContract === "object" && !Array.isArray(record.outputContract)
    ? (record.outputContract as Record<string, unknown>)
    : {};
  const deniedTools = Array.from(new Set([...parseStringArray(record.deniedTools), ...REQUIRED_DENIED_TOOLS]));
  const reasoningEffort = String(modelPolicy.reasoningEffort ?? "high");
  if (!AGENT_REASONING_EFFORTS.includes(reasoningEffort as (typeof AGENT_REASONING_EFFORTS)[number])) {
    throw AGENT_PROFILE_ERROR.securityInvalid("modelPolicy.reasoningEffort 不合法");
  }
  const tokenBudget = Number(modelPolicy.tokenBudget ?? 80000);
  const content: HubAgentProfileContent = {
    slug: String(record.slug ?? fallback.slug),
    name: String(record.name ?? fallback.name),
    defaultExecutor: normalizeExecutor(record.defaultExecutor),
    fallbackExecutors: parseStringArray(record.fallbackExecutors)
      .filter((item): item is Executor => AGENT_EXECUTORS.includes(item as Executor)),
    allowedTools: parseStringArray(record.allowedTools),
    deniedTools,
    contextScope: {
      allowSourceCode: Boolean(contextScope.allowSourceCode ?? false),
      allowRelativePath: Boolean(contextScope.allowRelativePath ?? true),
      allowAbsolutePath: Boolean(contextScope.allowAbsolutePath ?? false),
    },
    modelPolicy: {
      tokenBudget,
      reasoningEffort: reasoningEffort as HubAgentProfileContent["modelPolicy"]["reasoningEffort"],
    },
    approvalPolicy: {
      beforePush: Boolean(approvalPolicy.beforePush ?? true),
      beforeMerge: Boolean(approvalPolicy.beforeMerge ?? true),
      highRiskAlwaysManual: Boolean(approvalPolicy.highRiskAlwaysManual ?? true),
    },
    outputContract: {
      mustReturn: parseStringArray(outputContract.mustReturn),
    },
    riskLevel: normalizeRiskLevel(record.riskLevel),
  };
  if (content.fallbackExecutors.length === 0) content.fallbackExecutors = ["claude-code", "codex"];
  const result = validateAgentProfileContent(content);
  if (!result.valid) throw AGENT_PROFILE_ERROR.securityInvalid(result.errors[0]?.message);
  return content;
}

export function validateAgentProfileContent(content: unknown) {
  const errors: AgentProfileSecurityIssue[] = [];
  try {
    assertNoSensitivePayload(content);
  } catch (error) {
    const hubError = error as { code?: string; message?: string; suggestion?: string };
    errors.push({
      code: hubError.code ?? "PRIVACY_VIOLATION",
      message: hubError.message ?? "Agent Profile 含有敏感内容",
      suggestion: hubError.suggestion ?? "请移除敏感内容。",
    });
  }
  const record = content && typeof content === "object" && !Array.isArray(content) ? (content as Partial<HubAgentProfileContent>) : {};
  if (!AGENT_EXECUTORS.includes(record.defaultExecutor as Executor)) {
    errors.push({
      code: "INVALID_AGENT_EXECUTOR",
      message: "Agent Profile defaultExecutor 不合法",
      suggestion: "请使用 cursor、codex 或 claude-code。",
    });
  }
  const deniedTools = Array.isArray(record.deniedTools) ? record.deniedTools : [];
  for (const tool of REQUIRED_DENIED_TOOLS) {
    if (!deniedTools.includes(tool)) {
      errors.push({
        code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
        message: `deniedTools 必须包含 ${tool}`,
        suggestion: `请在 deniedTools 中加入 ${tool}。`,
      });
    }
  }
  if (record.contextScope?.allowSourceCode !== false) {
    errors.push({
      code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
      message: "contextScope.allowSourceCode 必须为 false",
      suggestion: "请关闭源码读取权限。",
    });
  }
  if (record.contextScope?.allowAbsolutePath !== false) {
    errors.push({
      code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
      message: "contextScope.allowAbsolutePath 必须为 false",
      suggestion: "请禁止绝对路径访问。",
    });
  }
  if (record.approvalPolicy?.beforePush !== true) {
    errors.push({
      code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
      message: "approvalPolicy.beforePush 必须为 true",
      suggestion: "请开启 push 前人工审批。",
    });
  }
  if (record.approvalPolicy?.beforeMerge !== true) {
    errors.push({
      code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
      message: "approvalPolicy.beforeMerge 必须为 true",
      suggestion: "请开启 merge 前人工审批。",
    });
  }
  if (record.approvalPolicy?.highRiskAlwaysManual !== true) {
    errors.push({
      code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
      message: "approvalPolicy.highRiskAlwaysManual 必须为 true",
      suggestion: "请设置高风险操作始终人工审批。",
    });
  }
  if (!Number.isFinite(Number(record.modelPolicy?.tokenBudget)) || Number(record.modelPolicy?.tokenBudget) <= 0) {
    errors.push({
      code: "AGENT_PROFILE_SECURITY_POLICY_INVALID",
      message: "modelPolicy.tokenBudget 必须为正数",
      suggestion: "请设置大于 0 的 tokenBudget。",
    });
  }
  return { valid: errors.length === 0, errors, warnings: [] as AgentProfileSecurityIssue[] };
}

export function computeAgentProfileChecksum(content: HubAgentProfileContent) {
  return safeJsonHash(content);
}

export function serializeAgentProfileSummary(profile: HubAgentProfile) {
  return {
    id: profile.id,
    slug: profile.slug,
    name: profile.name,
    version: profile.version,
    status: profile.status,
    riskLevel: profile.riskLevel ?? profile.content.riskLevel,
    defaultExecutor: profile.content.defaultExecutor,
    deniedTools: profile.content.deniedTools,
    checksum: profile.checksum,
    ownerTeamId: profile.ownerTeamId ?? undefined,
    ownerUserId: profile.ownerUserId ?? undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    publishedAt: profile.publishedAt ?? undefined,
  };
}

export function serializeAgentProfileDetail(profile: HubAgentProfile) {
  assertNoSensitivePayload(profile.content);
  return {
    profile: {
      ...serializeAgentProfileSummary(profile),
      description: profile.description ?? undefined,
      content: profile.content,
      ownerOrgId: profile.ownerOrgId ?? undefined,
      deprecatedAt: profile.deprecatedAt ?? undefined,
      archivedAt: profile.archivedAt ?? undefined,
    },
  };
}

function normalizeRiskLevel(value: unknown): HubAgentProfileContent["riskLevel"] {
  const riskLevel = String(value ?? "medium");
  if (riskLevel === "low" || riskLevel === "medium" || riskLevel === "high") return riskLevel;
  return "medium";
}
