import { describe, expect, it } from "vitest";
import { checkApiRateLimit } from "@/lib/api-rate-limit";

describe("api-rate-limit", () => {
  it("窗口内超过 max 次后拒绝", async () => {
    const k = `t:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect((await checkApiRateLimit(k, { max: 3, windowMs: 10_000 })).ok).toBe(true);
    }
    const last = await checkApiRateLimit(k, { max: 3, windowMs: 10_000 });
    expect(last.ok).toBe(false);
    if (!last.ok) {
      expect(last.retryAfterSec).toBeGreaterThan(0);
    }
  });
});
