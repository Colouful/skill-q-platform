import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  assertHubAuthForDeclaredAuthor,
  assertHubAuthForResourceAuthor,
  getHubActor,
  isHubAdmin,
  isHubAuthEnabled,
} from "@/lib/hub-auth";

describe("hub-auth", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env = { ...prev };
  });

  afterEach(() => {
    process.env = prev;
  });

  it("未开启 HUB_AUTH 时不校验", () => {
    delete process.env.HUB_AUTH;
    expect(isHubAuthEnabled()).toBe(false);
    const req = new Request("http://localhost/", { headers: {} });
    expect(() => assertHubAuthForDeclaredAuthor(req, "Alice")).not.toThrow();
  });

  it("开启 HUB_AUTH 时声明作者须与 X-Hub-Actor 一致", () => {
    process.env.HUB_AUTH = "on";
    const ok = new Request("http://localhost/", {
      headers: { "X-Hub-Actor": "Alice" },
    });
    expect(() => assertHubAuthForDeclaredAuthor(ok, "Alice")).not.toThrow();
    const bad = new Request("http://localhost/", {
      headers: { "X-Hub-Actor": "Bob" },
    });
    expect(() => assertHubAuthForDeclaredAuthor(bad, "Alice")).toThrow();
  });

  it("HUB_ADMIN_SECRET 匹配时视为管理员", () => {
    process.env.HUB_AUTH = "on";
    process.env.HUB_ADMIN_SECRET = "secret-token";
    const req = new Request("http://localhost/", {
      headers: { "X-Hub-Admin-Secret": "secret-token" },
    });
    expect(isHubAdmin(req)).toBe(true);
    expect(() => assertHubAuthForResourceAuthor(req, "Anyone")).not.toThrow();
  });

  it("getHubActor 读取请求头", () => {
    const req = new Request("http://localhost/", {
      headers: { "X-Hub-Actor": "  me  " },
    });
    expect(getHubActor(req)).toBe("me");
  });
});
