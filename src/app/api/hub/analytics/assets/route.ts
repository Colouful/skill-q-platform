import { getHubAnalytics } from "@/lib/hub-analytics";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const analytics = await getHubAnalytics();
    return hubOk(analytics.assets, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
