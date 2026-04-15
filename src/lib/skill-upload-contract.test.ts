import { describe, expect, it } from "vitest";
import { MAX_SKILL_INITIAL_FILES, skillCreateBodySchema } from "@/lib/skill-upload-contract";

function buildPayload(fileCount: number) {
  return {
    name: "demo-skill",
    description: "demo",
    author: "tester",
    categorySlug: "dev-tools",
    initialFiles: Array.from({ length: fileCount }, (_, index) => ({
      name: `file-${index}.md`,
      path: `docs/file-${index}.md`,
      content: `# ${index}`,
    })),
  };
}

describe("skillCreateBodySchema", () => {
  it("应允许不超过上限的初始文件数", () => {
    const parsed = skillCreateBodySchema.safeParse(buildPayload(MAX_SKILL_INITIAL_FILES));
    expect(parsed.success).toBe(true);
  });

  it("超过上限时应拒绝", () => {
    const parsed = skillCreateBodySchema.safeParse(buildPayload(MAX_SKILL_INITIAL_FILES + 1));
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((issue) => issue.message.includes(String(MAX_SKILL_INITIAL_FILES)))).toBe(
      true,
    );
  });
});
