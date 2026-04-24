import { previewHubInstall } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const preview = await previewHubInstall(await req.json());
    return hubOk(preview, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
