import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { executeSkillVersionDownload } from "@/lib/skill-version-download";

export const dynamic = "force-dynamic";

/** 记录下载次数并返回可下载信息（外链或文件清单） */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string; ver: string }> },
) {
  try {
    const { slug, ver: verParam } = await ctx.params;
    const versionLabel = decodeURIComponent(verParam);

    const bumped = await executeSkillVersionDownload(slug, versionLabel, req);
    if (!bumped.ok) {
      return jsonErr(bumped.message, bumped.status);
    }

    const { version, skillDownloads } = bumped;

    return jsonOk({
      version: version.version,
      downloadUrl: version.downloadUrl,
      files: version.files,
      versionDownloads: version.downloads,
      skillDownloads,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
