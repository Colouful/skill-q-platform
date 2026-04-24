import { reportHubRuntime } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const record = await reportHubRuntime(await req.json());
    return hubOk(record, "运行态已回流", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
