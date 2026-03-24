import { jsonOk } from "@/lib/api-response";
import { getMaintenanceModeCached } from "@/lib/system-config";

export const dynamic = "force-dynamic";

/** 供中间件与前端探测维护模式（无鉴权） */
export async function GET() {
  const active = await getMaintenanceModeCached();
  return jsonOk({ active });
}
