import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { normalizeRoleVersionFiles } from "@/lib/role-version";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; ver: string }> },
) {
  try {
    const { slug, ver: verParam } = await ctx.params;
    const versionLabel = decodeURIComponent(verParam);

    const role = await prisma.roleTemplate.findUnique({
      where: { slug },
      select: { id: true, publishStatus: true },
    });
    if (!role) {
      return jsonErr("专家不存在", 404);
    }
    if (role.publishStatus !== CATALOG_PUBLISH_STATUS.PUBLISHED) {
      return jsonErr("专家未发布", 403);
    }

    const version = await prisma.roleVersion.findUnique({
      where: { roleId_version: { roleId: role.id, version: versionLabel } },
    });
    if (!version) {
      return jsonErr("版本不存在", 404);
    }

    return jsonOk({
      version: version.version,
      downloadUrl: version.downloadUrl,
      files: normalizeRoleVersionFiles(version.files),
      isLatest: version.isLatest,
      createdAt: version.createdAt,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
