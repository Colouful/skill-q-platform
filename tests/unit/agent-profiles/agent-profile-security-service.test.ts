import { describe, expect, it } from "vitest";
import { AgentProfileSecurityService } from "@/server/hub/agent-profile-security-service";
import { createAgentProfileContent } from "./agent-profile-test-fixtures";

describe("AgentProfileSecurityService", () => {
  it("应识别缺少 deniedTools 的安全错误", () => {
    const service = new AgentProfileSecurityService();
    const content = createAgentProfileContent({ deniedTools: ["upload-source", "deploy", "push"] });

    const result = service.validateContent(content);

    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.message)).toContain("deniedTools 必须包含 merge");
  });

  it("应识别 contextScope 和 approvalPolicy 安全错误", () => {
    const service = new AgentProfileSecurityService();
    const content = createAgentProfileContent({
      contextScope: { allowSourceCode: true, allowRelativePath: true, allowAbsolutePath: true },
      approvalPolicy: { beforePush: false, beforeMerge: false, highRiskAlwaysManual: false },
    });

    const result = service.validateContent(content);

    expect(result.errors.map((item) => item.message)).toEqual(
      expect.arrayContaining([
        "contextScope.allowSourceCode 必须为 false",
        "contextScope.allowAbsolutePath 必须为 false",
        "approvalPolicy.beforePush 必须为 true",
        "approvalPolicy.beforeMerge 必须为 true",
        "approvalPolicy.highRiskAlwaysManual 必须为 true",
      ]),
    );
  });

  it("应拒绝非法 defaultExecutor、非正 tokenBudget 和敏感字段", () => {
    const service = new AgentProfileSecurityService();
    const content = {
      ...createAgentProfileContent(),
      defaultExecutor: "unknown",
      modelPolicy: { tokenBudget: 0, reasoningEffort: "high" },
      sourceCode: "不允许",
    };

    const result = service.validateContent(content);

    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toEqual(
      expect.arrayContaining(["PRIVACY_VIOLATION", "INVALID_AGENT_EXECUTOR", "AGENT_PROFILE_SECURITY_POLICY_INVALID"]),
    );
  });
});
