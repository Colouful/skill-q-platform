import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetGovernanceService, AssetQueryService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const data = await new AssetQueryService().detail(decodeURIComponent(assetId));
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = await new AssetGovernanceService().updateDraft(decodeURIComponent(assetId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
