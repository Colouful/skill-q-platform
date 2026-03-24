import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const items = await prisma.skill.findMany({
      where: { moderationStatus: MODERATION_STATUS.PENDING },
      include: { category: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return jsonOk({ items });
  } catch (e) {
    return toApiResponse(e);
  }
}
