import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; ver: string }> },
) {
  try {
    const { slug, ver: verParam } = await ctx.params;
    const versionLabel = decodeURIComponent(verParam);

    const rule = await prisma.rule.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!rule) {
      return jsonErr("Rule 不存在", 404);
    }

    const row = await prisma.ruleVersion.findUnique({
      where: {
        ruleId_version: { ruleId: rule.id, version: versionLabel },
      },
    });
    if (!row) {
      return jsonErr("版本不存在", 404);
    }

    return jsonOk(row);
  } catch (e) {
    return toApiResponse(e);
  }
}
