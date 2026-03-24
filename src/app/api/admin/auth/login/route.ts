import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MS,
  createAdminSession,
  publicAdminSummary,
} from "@/lib/admin-auth";
import { verifyAdminPassword } from "@/lib/admin-password";
import { apiSuccess, jsonErr } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr("邮箱或密码无效", 400);
    }
    const email = parsed.data.email.trim().toLowerCase();
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin?.isActive) {
      return jsonErr("账号或密码错误", 401);
    }
    const ok = await verifyAdminPassword(parsed.data.password, admin.passwordHash);
    if (!ok) {
      return jsonErr("账号或密码错误", 401);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const { sessionId } = await createAdminSession(admin.id);
    const payload = apiSuccess({ admin: publicAdminSummary(admin) }, "登录成功");
    const res = NextResponse.json(payload);
    res.cookies.set(ADMIN_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(ADMIN_SESSION_MS / 1000),
    });
    return res;
  } catch (e) {
    return toApiResponse(e);
  }
}
