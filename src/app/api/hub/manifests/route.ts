import { createHubManifest, listHubManifests } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const manifests = await listHubManifests(new URL(req.url).searchParams);
    return hubOk(manifests, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}

export async function POST(req: Request) {
  try {
    const manifest = await createHubManifest(await req.json());
    return hubOk(manifest, "Manifest 已保存", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
