import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const q = searchParams.get("q")?.trim();

    const where = {
      publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.roleTemplate.count({ where }),
      prisma.roleTemplate.findMany({
        where,
        include: {
          domainLinks: { include: { domain: true } },
          skillLinks: { select: { id: true } },
          ruleLinks: { select: { id: true } },
        },
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonOk({ items, total, page, pageSize });
  } catch (e) {
    return toApiResponse(e);
  }
}
