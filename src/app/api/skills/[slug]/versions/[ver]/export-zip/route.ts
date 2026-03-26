import { toApiResponse } from "@/lib/api-errors";
import { respondWithSkillVersionZip } from "@/lib/skill-export-zip-response";

export const dynamic = "force-dynamic";

/** 13.7 打包为 ZIP 下载（与统计次数一并记录） */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string; ver: string }> },
) {
  try {
    const { slug, ver: verParam } = await ctx.params;
    const versionLabel = decodeURIComponent(verParam);
    return await respondWithSkillVersionZip(req, slug, versionLabel);
  } catch (e) {
    return toApiResponse(e);
  }
}
