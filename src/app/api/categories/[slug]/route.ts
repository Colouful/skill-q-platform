import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { ApiError, toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const category = await prisma.category.findUnique({
      where: { slug_resourceType: { slug, resourceType: "skill" } },
      include: {
        skills: {
          orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
        },
      },
    });
    if (!category) {
      throw new ApiError("分类不存在", 404);
    }
    return jsonOk(category);
  } catch (e) {
    return toApiResponse(e);
  }
}
