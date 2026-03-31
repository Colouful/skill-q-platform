import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS, isPublishedCatalogStatus } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const role = await prisma.roleTemplate.findUnique({
      where: { slug },
      include: {
        domainLinks: { include: { domain: true } },
        skillLinks: {
          where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { skill: { include: { category: true } } },
        },
        ruleLinks: {
          where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { rule: { include: { category: true } } },
        },
        scenarioLinks: {
          where: { scenarioPackage: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { scenarioPackage: true },
        },
      },
    });

    if (!role || !isPublishedCatalogStatus(role.publishStatus)) {
      return jsonErr("专家不存在", 404);
    }

    return jsonOk({ role });
  } catch (e) {
    return toApiResponse(e);
  }
}
