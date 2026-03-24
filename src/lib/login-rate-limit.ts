import { checkApiRateLimit, type RateLimitResult } from "@/lib/api-rate-limit";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

/** 登录：每 IP 每小时 20 次（与任务书 Phase 7.3.1 对齐） */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return checkApiRateLimit(`api:login:${ip}`, { max: MAX_PER_WINDOW, windowMs: WINDOW_MS });
}
