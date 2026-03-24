import { jsonErr } from "@/lib/api-response";
import {
  checkApiRateLimit,
  rateLimitResponseHeaders,
  type RateLimitResult,
} from "@/lib/api-rate-limit";
import { rateLimitForAgentLevel } from "@/lib/agent-levels";

/** 按 Agent 等级使用默认每小时配额（与 `LEVEL_RATE_LIMIT_PER_HOUR` 对齐） */
export async function rateLimitForAgent(
  agentId: string,
  level: number,
  bucketSuffix: string,
): Promise<RateLimitResult> {
  const max = rateLimitForAgentLevel(level);
  return checkApiRateLimit(`api:agent:${agentId}:${bucketSuffix}`, {
    max,
    windowMs: 60 * 60 * 1000,
  });
}

export function rateLimitExceededResponse(rl: Extract<RateLimitResult, { ok: false }>) {
  return jsonErr("请求过于频繁，请稍后再试", 429, 1, {
    headers: rateLimitResponseHeaders(rl),
  });
}

export { rateLimitResponseHeaders };
