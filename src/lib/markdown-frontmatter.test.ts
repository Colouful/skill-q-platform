import { describe, expect, it } from "vitest";
import { stripLeadingFrontmatter } from "@/lib/markdown-frontmatter";

describe("stripLeadingFrontmatter", () => {
  it("removes leading frontmatter blocks", () => {
    expect(
      stripLeadingFrontmatter(`---
id: demo
name: Demo
---

# Title

Body`),
    ).toBe("# Title\n\nBody");
  });

  it("returns trimmed content when frontmatter is absent", () => {
    expect(stripLeadingFrontmatter("\n\n# Title\n\nBody\n")).toBe("# Title\n\nBody");
  });
});
