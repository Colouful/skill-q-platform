import { describe, expect, it } from "vitest";
import { AgentProfileService } from "@/server/hub/agent-profile-service";
import { AgentProfileValidator } from "@/server/hub/agent-profile-validator";
import { createSeededHubRepository, DEFAULT_AGENT_PROFILE } from "@/server/hub/seed";

describe("AgentProfileValidator", () => {
  it("Agent Profile 校验成功", () => {
    const result = new AgentProfileValidator().validate(DEFAULT_AGENT_PROFILE);
    expect(result.passed).toBe(true);
  });

  it("缺少 upload-source 禁止项时报错", () => {
    const result = new AgentProfileValidator().validate({
      ...DEFAULT_AGENT_PROFILE,
      deniedTools: ["deploy", "push", "merge"],
    });

    expect(result.passed).toBe(false);
    expect(result.issues.some((item) => item.message.includes("upload-source"))).toBe(true);
  });

  it("Agent Profile Export 成功并返回 checksum", () => {
    const payload = new AgentProfileService(createSeededHubRepository()).export({
      slug: "diagnostic-agent",
      version: "1.0.0",
    });

    expect(payload.checksum).toMatch(/^sha256:/);
    expect(payload.content.deniedTools).toContain("upload-source");
    expect(payload.content.deniedTools).toContain("push");
    expect(payload.content.deniedTools).toContain("merge");
  });
});
