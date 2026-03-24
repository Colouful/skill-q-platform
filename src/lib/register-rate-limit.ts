import { checkApiRateLimit, type RateLimitResult } from "@/lib/api-rate-limit";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
  return checkApiRateLimit(`api:register:${ip}`, { max: MAX_PER_WINDOW, windowMs: WINDOW_MS });
}
