import { NextResponse } from "next/server";
import { jsonErr } from "@/lib/api-response";
import { executeSkillVersionDownload } from "@/lib/skill-version-download";
import { buildZipFromVersionFiles } from "@/lib/version-files-zip";

/** 校验策略、记下载次数后输出 ZIP（export-zip 使用） */
export async function respondWithSkillVersionZip(
  req: Request,
  slug: string,
  versionLabel: string,
): Promise<Response> {
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
      "Cache-Control": "private, no-store",
    },
  });
}
