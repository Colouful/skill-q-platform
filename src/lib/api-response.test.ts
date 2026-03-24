import { describe, expect, it } from "vitest";
import { apiSuccess, apiFail, jsonOk } from "./api-response";

describe("api-response", () => {
  it("apiSuccess 返回 code 0 与 data", () => {
    const r = apiSuccess({ id: 1 }, "ok");
    expect(r.code).toBe(0);
    expect(r.data).toEqual({ id: 1 });
    expect(r.message).toBe("ok");
  });

  it("apiFail 返回非 0 code", () => {
    const r = apiFail("bad", 3);
    expect(r.code).toBe(3);
    expect(r.data).toBeNull();
  });

  it("jsonOk 可被 JSON 序列化", async () => {
    const res = jsonOk({ a: true });
    const j = (await res.json()) as { code: number; data: { a: boolean } };
    expect(j.code).toBe(0);
    expect(j.data.a).toBe(true);
  });
});
