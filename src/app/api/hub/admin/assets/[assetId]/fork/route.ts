import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetInheritanceService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new AssetInheritanceService().fork(decodeURIComponent(assetId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
