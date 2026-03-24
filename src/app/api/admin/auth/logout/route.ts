import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, deleteAdminSessionById } from "@/lib/admin-auth";
import { apiSuccess } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (sid) {
      await deleteAdminSessionById(sid);
    }
    const res = NextResponse.json(apiSuccess(null, "已登出"));
    res.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    return toApiResponse(e);
  }
}
