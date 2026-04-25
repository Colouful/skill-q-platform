import { HubError } from "./errors";
import type { HubAgentProfileContent } from "./types";

const VALID_EXECUTORS = new Set(["cursor", "codex", "claude-code"]);
const REQUIRED_DENIED_TOOLS = ["upload-source", "deploy", "push", "merge"];

export type AgentProfileIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  suggestion: string;
};

export class AgentProfileValidator {
  validate(profile: Partial<HubAgentProfileContent>) {
    const issues: AgentProfileIssue[] = [];
    if (!profile.defaultExecutor) {
      issues.push({
        level: "error",
        code: "DEFAULT_EXECUTOR_REQUIRED",
        message: "Agent Profile 必须指定 defaultExecutor",
        suggestion: "请设置 cursor、codex 或 claude-code。",
      });
    } else if (!VALID_EXECUTORS.has(profile.defaultExecutor)) {
      issues.push({
        level: "error",
        code: "DEFAULT_EXECUTOR_INVALID",
        message: "Agent Profile defaultExecutor 非法",
        suggestion: "请使用 cursor、codex 或 claude-code。",
      });
    }

    const deniedTools = Array.isArray(profile.deniedTools) ? profile.deniedTools : [];
    for (const tool of REQUIRED_DENIED_TOOLS) {
      if (!deniedTools.includes(tool)) {
        issues.push({
          level: "error",
          code: "DENIED_TOOL_REQUIRED",
          message: `Agent Profile 必须禁止 ${tool}`,
          suggestion: `请在 deniedTools 中加入 ${tool}。`,
        });
      }
    }

    if (profile.approvalPolicy?.beforePush !== true) {
      issues.push({
        level: "warning",
        code: "BEFORE_PUSH_RECOMMENDED",
        message: "建议 push 前必须人工审批",
        suggestion: "请将 approvalPolicy.beforePush 设置为 true。",
      });
    }
    if (profile.approvalPolicy?.beforeMerge !== true) {
      issues.push({
        level: "warning",
        code: "BEFORE_MERGE_RECOMMENDED",
        message: "建议 merge 前必须人工审批",
        suggestion: "请将 approvalPolicy.beforeMerge 设置为 true。",
      });
    }
    if (!profile.outputContract?.mustReturn?.includes("summary")) {
      issues.push({
        level: "error",
        code: "OUTPUT_CONTRACT_INVALID",
        message: "Agent Profile outputContract.mustReturn 必须包含 summary",
        suggestion: "请补充 summary、changedFiles、risks、verification 等输出字段。",
      });
    }

    return {
      passed: !issues.some((item) => item.level === "error"),
      issues,
    };
  }

  assertValid(profile: Partial<HubAgentProfileContent>) {
    const result = this.validate(profile);
    const firstError = result.issues.find((item) => item.level === "error");
    if (firstError) {
      throw new HubError(firstError.code, firstError.message, firstError.suggestion, 400);
    }
    return result;
  }
}
