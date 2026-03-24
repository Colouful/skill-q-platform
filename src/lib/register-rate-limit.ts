import { checkApiRateLimit, type RateLimitResult } from "@/lib/api-rate-limit";
import { getRegisterMaxPerHour } from "@/lib/system-config";

const WINDOW_MS = 60 * 60 * 1000;

export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
  const max = await getRegisterMaxPerHour();
  return checkApiRateLimit(`api:register:${ip}`, { max, windowMs: WINDOW_MS });
}
