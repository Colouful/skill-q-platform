import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { bumpRuleVersionDownloads } from "@/lib/rule-version-download";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slug: string; ver: string }> },
) {
  try {
    const { slug, ver: verParam } = await ctx.params;
    const versionLabel = decodeURIComponent(verParam);

    const bumped = await bumpRuleVersionDownloads(slug, versionLabel);
    if (!bumped) {
      return jsonErr("Rule 或版本不存在", 404);
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
