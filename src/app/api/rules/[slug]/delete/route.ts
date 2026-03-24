import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api-response";
import { ApiError, toApiResponse } from "@/lib/api-errors";
import { assertHubAuthForResourceAuthor } from "@/lib/hub-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const existing = await prisma.rule.findUnique({ where: { slug } });
    if (!existing) {
      throw new ApiError("Rule 不存在", 404);
    }

    assertHubAuthForResourceAuthor(req, existing.author);

    await prisma.rule.delete({ where: { slug } });

    return jsonOk({ deleted: true, slug }, "已删除");
  } catch (e) {
    return toApiResponse(e);
  }
}
