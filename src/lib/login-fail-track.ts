import { checkApiRateLimit } from "@/lib/api-rate-limit";

/** 登录失败过多时打日志（启发式「泄露/暴破」关注，非阻断） */
export async function trackFailedLoginAttempt(ip: string) {
  const r = await checkApiRateLimit(`auth:login-fail:${ip}`, {
    max: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!r.ok) {
    console.warn(`[agent-auth] IP ${ip} 登录失败次数过高（1h 窗口），请关注`);
  }
}
