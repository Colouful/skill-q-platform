import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/lib/agent-auth";
import { getSessionFromCookie } from "@/middleware/auth";

describe("middleware/auth", () => {
  it("getSessionFromCookie 解析 HttpOnly Cookie", () => {
    const sid = "abc123";
    const header = `foo=1; ${SESSION_COOKIE}=${sid}; path=/`;
    expect(getSessionFromCookie(header)).toBe(sid);
  });

  it("getSessionFromCookie 无匹配时返回 undefined", () => {
    expect(getSessionFromCookie("other=1")).toBeUndefined();
    expect(getSessionFromCookie(null)).toBeUndefined();
  });
});
