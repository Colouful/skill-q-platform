import { jsonErr } from "@/lib/api-response";
import { getAdminFromRequest } from "@/lib/admin-auth";

export async function requireAdminJson(req: Request) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return { ok: false as const, response: jsonErr("需要管理员登录", 401) };
  }
  return { ok: true as const, admin };
}
