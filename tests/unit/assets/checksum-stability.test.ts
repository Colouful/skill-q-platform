import { describe, expect, it } from "vitest";
import { safeJsonHash, sha256Text } from "@/server/hub/checksum";

describe("Hub checksum 稳定性", () => {
  it("相同文本内容应生成稳定 checksum", () => {
    const content = "# Asset\n\n相同内容。\n";

    expect(sha256Text(content)).toBe(sha256Text(content));
    expect(sha256Text(content)).toMatch(/^sha256:/);
  });

  it("文本内容变化后 checksum 应变化", () => {
    expect(sha256Text("# Asset\n")).not.toBe(sha256Text("# Asset changed\n"));
  });

  it("JSON 字段顺序不同也应生成稳定 checksum", () => {
    const left = { slug: "manifest", version: "1.0.0", installPolicy: { fallbackExecutors: ["codex"] } };
    const right = { installPolicy: { fallbackExecutors: ["codex"] }, version: "1.0.0", slug: "manifest" };

    expect(safeJsonHash(left)).toBe(safeJsonHash(right));
  });

  it("JSON 内容变化后 checksum 应变化", () => {
    expect(safeJsonHash({ slug: "asset", version: "1.0.0" })).not.toBe(
      safeJsonHash({ slug: "asset", version: "1.1.0" }),
    );
  });
});
