import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/admin-api-route";
import { getAdminRegistryOverview } from "@/lib/admin-registry-overview";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const overview = await getAdminRegistryOverview();
    return NextResponse.json(overview, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toApiResponse(error);
  }
}
