import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBlockedIp } from "@/lib/hub-blocklist";

/** 维护状态内存缓存，避免每次导航 / 预取都打到 API（否则中间件内 fetch 会显著拖慢页面切换） */
const MAINTENANCE_TTL_MS = 15_000;
let maintenanceCache: { value: boolean; expires: number } | null = null;

async function fetchMaintenanceActive(req: NextRequest): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now < maintenanceCache.expires) {
    return maintenanceCache.value;
  }

  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/system/maintenance-state`, {
      cache: "no-store",
      headers: { "x-internal": "middleware" },
    });
    if (!res.ok) {
      maintenanceCache = { value: false, expires: now + MAINTENANCE_TTL_MS };
      return false;
    }
    const json = (await res.json()) as { code?: number; data?: { active?: boolean } };
    const active = json?.data?.active === true;
    maintenanceCache = { value: active, expires: now + MAINTENANCE_TTL_MS };
    return active;
  } catch {
    maintenanceCache = { value: false, expires: now + MAINTENANCE_TTL_MS };
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  const ip = xf ? xf.split(",")[0]?.trim() : req.headers.get("x-real-ip")?.trim() ?? "";
  if (isBlockedIp(ip)) {
    return NextResponse.json(
      { code: 403, message: "访问被拒绝", data: null },
      { status: 403 },
    );
  }

  const pathname = req.nextUrl.pathname;

  // Next 内部资源（含 dev Turbopack/webpack 等），不做维护探测；matcher 也未必能排干净所有 _next 子路径
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (pathname === "/api/system/maintenance-state" || pathname === "/api/site/public-settings") {
    return NextResponse.next();
  }

  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminArea) {
    return NextResponse.next();
  }

  if (pathname === "/maintenance" || pathname.startsWith("/maintenance/")) {
    return NextResponse.next();
  }

  /**
   * 开发环境默认不探测维护（避免中间件再请求 /api → 再占 Prisma 连接，与页面请求争抢池导致 pool timeout）。
   * 需要本地联调维护跳转时，在 .env 设置：
   * MAINTENANCE_MIDDLEWARE_FETCH=true
   */
  const skipMaintenanceInDev =
    process.env.NODE_ENV === "development" && process.env.MAINTENANCE_MIDDLEWARE_FETCH !== "true";

  if (skipMaintenanceInDev) {
    return NextResponse.next();
  }

  const maintenance = await fetchMaintenanceActive(req);
  if (!maintenance) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { code: 503, message: "站点维护中，请稍后再试", data: null },
      { status: 503 },
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
