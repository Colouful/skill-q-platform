import { reportHubInstall } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const record = await reportHubInstall(await req.json());
    return hubOk(record, "安装记录已上报", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
