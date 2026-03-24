import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import type { Admin } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function generateAdminSessionId(): string {
  return randomBytes(32).toString("hex");
}

export type AuthAdmin = Pick<Admin, "id" | "email" | "role" | "isActive">;

export function publicAdminSummary(admin: AuthAdmin) {
  return { id: admin.id, email: admin.email, role: admin.role };
}

export async function findAdminBySessionId(sessionId: string | undefined) {
  if (!sessionId) return null;
  const session = await prisma.adminSession.findUnique({
    where: { sessionId },
    include: { admin: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (!session.admin.isActive) return null;
  return { session, admin: session.admin };
}

/** App Router Route Handler / Server Component：读 Cookie */
export async function getAdminFromRequest(_req: Request) {
  const cookieStore = await cookies();
  const sid = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const hit = await findAdminBySessionId(sid);
  return hit?.admin ?? null;
}

/** Server Component：仅 Cookie */
export async function getAdminFromSessionCookie() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const hit = await findAdminBySessionId(sid);
  return hit?.admin ?? null;
}

export async function createAdminSession(adminId: string) {
  const sessionId = generateAdminSessionId();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MS);
  await prisma.adminSession.create({
    data: {
      sessionId,
      adminId,
      expiresAt,
    },
  });
  return { sessionId, expiresAt };
}

export async function deleteAdminSessionById(sessionId: string) {
  await prisma.adminSession.deleteMany({ where: { sessionId } });
}
