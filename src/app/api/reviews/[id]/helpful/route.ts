import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return jsonErr("评测不存在", 404);
    }

    const review = await prisma.review.update({
      where: { id },
      data: { isHelpful: { increment: 1 } },
    });

    return jsonOk({ id: review.id, isHelpful: review.isHelpful });
  } catch (e) {
    return toApiResponse(e);
  }
}
