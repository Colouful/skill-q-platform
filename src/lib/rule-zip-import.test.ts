import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { importRuleMarkdownFile, importRuleZip } from "@/lib/rule-zip-import";

describe("importRuleMarkdownFile", () => {
  it("接受任意文件名的 .md", () => {
    const enc = new TextEncoder();
    const buf = enc.encode("---\nname: X\n---\nbody").buffer;
    const r = importRuleMarkdownFile(buf, "hello-world.md");
    expect(r.ruleMdPath).toBe("hello-world.md");
    expect(r.body.trim()).toBe("body");
    expect(r.hints.name).toBe("X");
  });
});

describe("importRuleZip", () => {
  it("ZIP 内仅有一个 .md 时用作主说明（不必名 RULE.md）", async () => {
    const zip = new JSZip();
    zip.file("nested/guide.md", "---\nname: G\n---\nhello");
    zip.file("readme.txt", "x");
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    const r = await importRuleZip(buf);
    expect(r.body.trim()).toBe("hello");
    expect(r.ruleMdPath).toBe("nested/guide.md");
    expect(r.issues.some((i) => i.includes("唯一 Markdown"))).toBe(true);
  });

  it("多个 .md 且无 RULE.md 时给出明确提示", async () => {
    const zip = new JSZip();
    zip.file("a.md", "a");
    zip.file("b.md", "b");
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    const r = await importRuleZip(buf);
    expect(r.body).toBe("");
    expect(r.ruleMdPath).toBeNull();
    expect(r.issues.some((i) => i.includes("多个 .md"))).toBe(true);
  });
});
