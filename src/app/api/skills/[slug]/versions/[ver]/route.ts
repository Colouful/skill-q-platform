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

    const skill = await prisma.skill.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!skill) {
      return jsonErr("Skill 不存在", 404);
    }

    const row = await prisma.version.findUnique({
      where: {
        skillId_version: { skillId: skill.id, version: versionLabel },
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
