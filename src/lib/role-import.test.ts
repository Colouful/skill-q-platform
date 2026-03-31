import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { importRoleMarkdownFile, importRoleZip } from "@/lib/role-import";

const roleMarkdown = `---
id: requirement-analyst
name: 需求解析专家
status: active
domains:
  - demand-design
description: 负责需求收敛。
triggers:
  - prd-input
preferred_skills:
  - create-proposal
reads:
  - context/PROJECT.md
writes:
  - openspec/changes/<change-id>/proposal.md
handoff_to:
  - frontend-implementer
owner: task-orchestrator
---

# 需求解析专家

## 角色定位

负责把需求变成可执行提案。

## 工作原则

- 先理解业务目标
- 先暴露不确定项

## 必做步骤

1. 读取上下文
2. 生成 proposal

## 执行契约

遵守项目契约。

## 输出标准

输出 proposal 和 tasks。

## 禁止事项

- 不直接编码

## 交接

输出交给 frontend-implementer
`;

describe("role import", () => {
  it("parses role markdown and extracts structured sections", () => {
    const buf = new TextEncoder().encode(roleMarkdown).buffer;
    const result = importRoleMarkdownFile(buf, "requirement-analyst.md");

    expect(result.roleData.slug).toBe("requirement-analyst");
    expect(result.roleData.name).toBe("需求解析专家");
    expect(result.roleData.roleStatus).toBe("active");
    expect(result.roleData.domains).toEqual(["demand-design"]);
    expect(result.sections.workingPrinciples).toEqual(["先理解业务目标", "先暴露不确定项"]);
    expect(result.sections.requiredSteps).toEqual(["读取上下文", "生成 proposal"]);
    expect(result.sections.handoffNotes).toBe("输出交给 frontend-implementer");
    expect(result.ignoredMetaKeys).toContain("owner");
  });

  it("uses ROLE.md inside zip", async () => {
    const zip = new JSZip();
    zip.file("docs/ROLE.md", roleMarkdown);
    zip.file("README.txt", "x");
    const buf = await zip.generateAsync({ type: "arraybuffer" });

    const result = await importRoleZip(buf);
    expect(result.roleMdPath).toBe("docs/ROLE.md");
    expect(result.roleData.slug).toBe("requirement-analyst");
  });

  it("rejects non-role markdown", () => {
    const raw = `---
id: expert-dispatch-spec
name: 专家派发载荷规范
status: active
owner: task-orchestrator
description: 文档
---

# 规范
`;
    const buf = new TextEncoder().encode(raw).buffer;
    expect(() => importRoleMarkdownFile(buf, "expert-dispatch-spec.md")).toThrow(/更像规范文档/);
  });
});
