import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { getAnalyticsOverview } from "@/lib/admin-analytics-queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const data = await getAnalyticsOverview();
    return jsonOk(data);
  } catch (e) {
    return toApiResponse(e);
  }
}
