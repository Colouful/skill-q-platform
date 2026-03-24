import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { executeRuleVersionDownload } from "@/lib/rule-version-download";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string; ver: string }> },
) {
  try {
    const { slug, ver: verParam } = await ctx.params;
    const versionLabel = decodeURIComponent(verParam);

    const bumped = await executeRuleVersionDownload(slug, versionLabel, req);
    if (!bumped.ok) {
      return jsonErr(bumped.message, bumped.status);
    }

    const { version, ruleDownloads } = bumped;

    return jsonOk({
      version: version.version,
      downloadUrl: version.downloadUrl,
      files: version.files,
      versionDownloads: version.downloads,
      ruleDownloads,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
