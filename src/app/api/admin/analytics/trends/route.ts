import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { getAnalyticsTrends, type TrendRange } from "@/lib/admin-analytics-queries";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("7d"),
});

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      range: url.searchParams.get("range") ?? undefined,
    });
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }

    const data = await getAnalyticsTrends(parsed.data.range as TrendRange);
    return jsonOk(data);
  } catch (e) {
    return toApiResponse(e);
  }
}
