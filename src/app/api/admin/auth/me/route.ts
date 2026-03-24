import { publicAdminSummary, getAdminFromRequest } from "@/lib/admin-auth";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    return jsonOk({ admin: admin ? publicAdminSummary(admin) : null });
  } catch (e) {
    return toApiResponse(e);
  }
}
