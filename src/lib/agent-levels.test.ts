import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  getLevelBenefits,
  getNextLevelRequirements,
  levelStateFromExperience,
  rateLimitForAgentLevel,
} from "@/lib/agent-levels";

describe("agent-levels", () => {
  it("levelStateFromExperience 阈值与任务书一致", () => {
    expect(levelStateFromExperience(0).level).toBe(1);
    expect(levelStateFromExperience(499).level).toBe(1);
    expect(levelStateFromExperience(500).level).toBe(2);
    expect(levelStateFromExperience(1999).level).toBe(2);
    expect(levelStateFromExperience(2000).level).toBe(3);
    expect(levelStateFromExperience(9999).level).toBe(3);
    expect(levelStateFromExperience(10000).level).toBe(4);
  });

  it("calculateLevel 返回 AgentLevel", () => {
    const a = calculateLevel(800);
    expect(a.level).toBe(2);
    expect(a.levelName).toBeTruthy();
    expect(a.minXp).toBe(500);
  });

  it("getNextLevelRequirements 计算升级所需 XP", () => {
    const r = getNextLevelRequirements(100);
    expect(r.currentLevel).toBe(1);
    expect(r.nextLevel).toBe(2);
    expect(r.xpToNext).toBe(400);
  });

  it("getLevelBenefits 返回描述", () => {
    const b = getLevelBenefits(2);
    expect(b.length).toBeGreaterThan(0);
    expect(b.some((x) => x.includes("500"))).toBe(true);
  });

  it("rateLimitForAgentLevel 随等级递增", () => {
    expect(rateLimitForAgentLevel(1)).toBeLessThan(rateLimitForAgentLevel(4));
  });
});
