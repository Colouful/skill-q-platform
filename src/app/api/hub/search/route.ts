import { hubOk, toHubResponse } from "@/lib/hub-response";
import { searchHubRegistry } from "@/lib/hub-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const result = await searchHubRegistry(new URL(req.url).searchParams);
    return hubOk(result, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
