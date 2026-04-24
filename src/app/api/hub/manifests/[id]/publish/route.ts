import { publishHubManifest } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await publishHubManifest(id, await req.json().catch(() => ({})));
    return hubOk(payload, "Manifest 已发布", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
