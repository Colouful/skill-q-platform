import { exportHubManifest } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const version = new URL(req.url).searchParams.get("version") || undefined;
    const payload = await exportHubManifest(id, version);
    return hubOk(payload, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
