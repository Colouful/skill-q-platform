import { describe, expect, it } from "vitest";
import { canEditSkillOrRule } from "@/lib/skill-rule-write-access";

describe("skill-rule-write-access", () => {
  const alice = { id: "a1", name: "Alice" };

  it("无登录不可编辑", () => {
    expect(canEditSkillOrRule(null, "x", "Alice")).toBe(false);
  });

  it("authorAgentId 匹配则可编辑", () => {
    expect(canEditSkillOrRule(alice, "a1", "Bob")).toBe(true);
    expect(canEditSkillOrRule(alice, "a2", "Alice")).toBe(false);
  });

  it("无 authorAgentId 时要求档案昵称与作者展示一致", () => {
    expect(canEditSkillOrRule(alice, null, "Alice")).toBe(true);
    expect(canEditSkillOrRule(alice, null, "Bob")).toBe(false);
  });
});
