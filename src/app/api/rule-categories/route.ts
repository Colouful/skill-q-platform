import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.category.findMany({
      where: { resourceType: "rule" },
      orderBy: { sortOrder: "asc" },
    });
    return jsonOk(items);
  } catch (e) {
    return toApiResponse(e);
  }
}
