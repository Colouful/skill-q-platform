import { createHubAsset, listHubAssets } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const assets = await listHubAssets(new URL(req.url).searchParams);
    return hubOk(assets, "操作成功", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}

export async function POST(req: Request) {
  try {
    const asset = await createHubAsset(await req.json());
    return hubOk(asset, "资产已保存", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
