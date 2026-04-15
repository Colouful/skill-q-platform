import { jsonErr } from "@/lib/api-response";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { isHubAdmin } from "@/lib/hub-auth";

const HUB_SECRET_ADMIN = {
  id: "hub-admin-secret",
  email: "hub-admin-secret@local",
  role: "admin",
  isActive: true,
} as const;

export async function requireAdminJson(req: Request) {
  if (isHubAdmin(req)) {
    return { ok: true as const, admin: HUB_SECRET_ADMIN };
  }

  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return { ok: false as const, response: jsonErr("需要管理员登录", 401) };
  }
  return { ok: true as const, admin };
}
