import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { getSystemConfigMap } from "@/lib/system-config";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const map = await getSystemConfigMap();
    return jsonOk({
      siteName: map[SYSTEM_CONFIG_KEYS.SITE_NAME],
      siteUrl: map[SYSTEM_CONFIG_KEYS.SITE_URL],
      defaultDownloadPolicy: map[SYSTEM_CONFIG_KEYS.DEFAULT_DOWNLOAD_POLICY],
      registerMaxPerHour: map[SYSTEM_CONFIG_KEYS.REGISTER_MAX_PER_HOUR],
      maintenanceMode: map[SYSTEM_CONFIG_KEYS.MAINTENANCE_MODE],
      uploadRequiresLogin: map[SYSTEM_CONFIG_KEYS.UPLOAD_REQUIRES_LOGIN],
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
