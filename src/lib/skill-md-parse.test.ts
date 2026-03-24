import { describe, expect, it } from "vitest";
import { metaToRuleHints, parseSkillMd } from "@/lib/skill-md-parse";

describe("metaToRuleHints", () => {
  it("识别 rule 字段为名称", () => {
    expect(metaToRuleHints({ rule: "订单规则" }).name).toBe("订单规则");
  });

  it("parseSkillMd + metaToRuleHints 联用", () => {
    const raw = `---
name: 地域路由
description: 示例
---
正文`;
    const { meta, body } = parseSkillMd(raw);
    const h = metaToRuleHints(meta);
    expect(h.name).toBe("地域路由");
    expect(h.description).toBe("示例");
    expect(body.trim()).toBe("正文");
  });
});
