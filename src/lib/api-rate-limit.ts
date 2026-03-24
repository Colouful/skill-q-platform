import { getRedis } from "@/lib/redis-client";

/** 进程内固定窗口限流（无 Redis 或 Redis 异常时回退；多副本请配置 Redis Cluster） */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const LUA_INCR_PEXPIRE = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then
  redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return c
`;

export type RateLimitResult =
  | { ok: true; limit: number; remaining: number; resetUnix: number }
  | { ok: false; retryAfterSec: number; limit: number; remaining: number; resetUnix: number };

function checkInMemoryRateLimit(key: string, opts: { max: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, b);
  }
  const resetUnix = Math.ceil(b.resetAt / 1000);
  if (b.count >= opts.max) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
    return {
      ok: false,
      retryAfterSec,
      limit: opts.max,
      remaining: 0,
      resetUnix,
    };
  }
  b.count += 1;
  return {
    ok: true,
    limit: opts.max,
    remaining: Math.max(0, opts.max - b.count),
    resetUnix,
  };
}

export function rateLimitResponseHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(r.resetUnix),
  };
}

function redisRateLimitKey(key: string): string {
  return `markview:rl:${key}`;
}

export function getRequestIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export async function checkApiRateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    return checkInMemoryRateLimit(key, opts);
  }

  const fullKey = redisRateLimitKey(key);
  try {
    const raw = await redis.eval(LUA_INCR_PEXPIRE, 1, fullKey, String(opts.windowMs));
    const count = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(count)) {
      return checkInMemoryRateLimit(key, opts);
    }
    const pttl = await redis.pttl(fullKey);
    const ms = pttl > 0 ? pttl : opts.windowMs;
    const resetUnix = Math.ceil((Date.now() + ms) / 1000);
    if (count <= opts.max) {
      return {
        ok: true,
        limit: opts.max,
        remaining: Math.max(0, opts.max - count),
        resetUnix,
      };
    }
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil(ms / 1000)),
      limit: opts.max,
      remaining: 0,
      resetUnix,
    };
  } catch {
    return checkInMemoryRateLimit(key, opts);
  }
}
