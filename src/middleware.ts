import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBlockedIp } from "@/lib/hub-blocklist";

export function middleware(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  const ip = xf ? xf.split(",")[0]?.trim() : req.headers.get("x-real-ip")?.trim() ?? "";
  if (isBlockedIp(ip)) {
    return NextResponse.json(
      { code: 403, message: "访问被拒绝", data: null },
      { status: 403 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
