import { type Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonOk } from "@/lib/api-response";
import { ApiError, toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

function parseSort(raw: string | null): Prisma.RuleOrderByWithRelationInput[] {
  switch (raw) {
    case "downloads":
      return [{ downloads: "desc" }, { updatedAt: "desc" }];
    case "rating":
      return [{ rating: "desc" }, { updatedAt: "desc" }];
    case "name":
      return [{ name: "asc" }];
    case "updated":
    default:
      return [{ isFeatured: "desc" }, { updatedAt: "desc" }];
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
    const sort = searchParams.get("sort");

    const category = await prisma.category.findUnique({
      where: { slug_resourceType: { slug, resourceType: "rule" } },
    });
    if (!category) {
      throw new ApiError("分类不存在", 404);
    }

    const where: Prisma.RuleWhereInput = {
      categoryId: category.id,
      moderationStatus: MODERATION_STATUS.PUBLISHED,
    };
    const orderBy = parseSort(sort);

    const [total, rules] = await Promise.all([
      prisma.rule.count({ where }),
      prisma.rule.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonOk({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      resourceType: category.resourceType,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      rules,
      total,
      page,
      pageSize,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
