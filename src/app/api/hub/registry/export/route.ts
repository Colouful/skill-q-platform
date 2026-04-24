import { hubOk, toHubResponse } from "@/lib/hub-response";
import { exportHubRegistry } from "@/lib/hub-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const registry = await exportHubRegistry(req);
    return hubOk(registry, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
