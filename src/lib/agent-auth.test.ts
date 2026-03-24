import { describe, expect, it } from "vitest";
import {
  apiKeyPrefix,
  generateApiKey,
  generateSessionId,
  getDefaultAvatar,
  hashApiKey,
} from "@/lib/agent-auth";

describe("agent-auth", () => {
  it("generateApiKey 以 sk_ 开头且长度合理", () => {
    const k = generateApiKey();
    expect(k.startsWith("sk_")).toBe(true);
    expect(k.length).toBeGreaterThan(10);
  });

  it("hashApiKey 为 64 位十六进制", () => {
    const h = hashApiKey("sk_test");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("相同明文得到相同哈希", () => {
    expect(hashApiKey("sk_abc")).toBe(hashApiKey("sk_abc"));
  });

  it("generateSessionId 为 64 位十六进制", () => {
    const s = generateSessionId();
    expect(s).toMatch(/^[0-9a-f]{64}$/);
  });

  it("apiKeyPrefix 截断长 Key 且长度不超过 DB VarChar(24)", () => {
    const long = "sk_" + "a".repeat(40);
    const p = apiKeyPrefix(long);
    expect(p.includes("…")).toBe(true);
    expect(p.length).toBe(24);
  });

  it("getDefaultAvatar 返回站内路径", () => {
    expect(getDefaultAvatar().startsWith("/")).toBe(true);
  });
});
