/**
 * 对外展示的站点根 URL（无尾斜杠）。
 * 预发/生产在各自 build 时通过 NEXT_PUBLIC_SITE_URL 注入（如 https://skillq-pre.100credit.cn）。
 * 未配置时，Markdown 指南等回退为当前请求的 protocol+host。
 */
export function publicSiteOriginFromEnv(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";
}

export function publicSiteOriginForRequest(requestUrl: string): string {
  const fromEnv = publicSiteOriginFromEnv();
  if (fromEnv) return fromEnv;
  const u = new URL(requestUrl);
  return `${u.protocol}//${u.host}`;
}
