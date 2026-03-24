import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";

export const dynamic = "force-dynamic";

/** GET /api/admin/categories?resourceType=skill|rule */
export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { searchParams } = new URL(req.url);
    const rt = searchParams.get("resourceType")?.trim();

    const where =
      rt === "skill" || rt === "rule" ? { resourceType: rt } : {};

    const items = await prisma.category.findMany({
      where,
      include: {
        _count: { select: { skills: true, rules: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return jsonOk({ items });
  } catch (e) {
    return toApiResponse(e);
  }
}
