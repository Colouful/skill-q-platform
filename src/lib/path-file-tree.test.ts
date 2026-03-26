import { describe, expect, it } from "vitest";
import {
  buildFilePathTree,
  collectParentFolderPrefixes,
  suggestDefaultParentPrefix,
} from "@/lib/path-file-tree";

describe("buildFilePathTree", () => {
  it("按路径层级建树并排序", () => {
    const items = [
      { path: "z.md", name: "z.md", content: "" },
      { path: "a/b.md", name: "b.md", content: "" },
      { path: "a/c.md", name: "c.md", content: "" },
    ];
    const tree = buildFilePathTree(items);
    expect(tree.map((n) => (n.kind === "folder" ? `dir:${n.name}` : `file:${n.fullPath}`))).toEqual([
      "dir:a",
      "file:z.md",
    ]);
    const a = tree.find((n) => n.kind === "folder" && n.prefix === "a");
    expect(a?.kind).toBe("folder");
    if (a?.kind === "folder") {
      expect(a.children.map((c) => c.kind === "file" && c.fullPath)).toEqual(["a/b.md", "a/c.md"]);
    }
  });

  it("支持仅虚拟空目录", () => {
    const tree = buildFilePathTree([{ path: "SKILL.md", name: "SKILL.md", content: "x" }], ["scripts"]);
    const scripts = tree.find((n) => n.kind === "folder" && n.prefix === "scripts");
    expect(scripts?.kind).toBe("folder");
    if (scripts?.kind === "folder") {
      expect(scripts.isVirtual).toBe(true);
      expect(scripts.children).toHaveLength(0);
    }
  });
});

describe("collectParentFolderPrefixes", () => {
  it("包含根与中间目录", () => {
    const p = collectParentFolderPrefixes([{ path: "a/b/c.md" }]);
    expect(p).toEqual(["", "a", "a/b"]);
  });
});

describe("suggestDefaultParentPrefix", () => {
  it("均在 A 下时返回 A", () => {
    expect(
      suggestDefaultParentPrefix([
        { path: "A/A-1/x.md" },
        { path: "A/A-2/y.md" },
      ]),
    ).toBe("A");
  });

  it("多个顶层目录时返回空", () => {
    expect(
      suggestDefaultParentPrefix([{ path: "A/x.md" }, { path: "B/y.md" }]),
    ).toBe("");
  });

  it("仅根目录文件时返回空", () => {
    expect(suggestDefaultParentPrefix([{ path: "SKILL.md" }])).toBe("");
  });
});
