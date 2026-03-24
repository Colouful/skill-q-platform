import { NextResponse } from "next/server";
import { jsonErr } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { executeSkillVersionDownload } from "@/lib/skill-version-download";
import { buildZipFromVersionFiles } from "@/lib/version-files-zip";

export const dynamic = "force-dynamic";

/** 13.7 打包为 ZIP 下载（与统计次数一并记录） */
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

    const { version } = bumped;
    const bytes = await buildZipFromVersionFiles(version.files);

    const filename = `${slug}-${version.version}.zip`.replace(/[^\w.\-]+/g, "_");

    const body = Buffer.from(bytes);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(body.length),
      },
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
