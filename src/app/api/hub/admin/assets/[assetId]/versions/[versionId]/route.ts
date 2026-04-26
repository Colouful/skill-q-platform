import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetVersionService, defaultHubRepository } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ assetId: string; versionId: string }> }) {
  try {
    const { assetId, versionId } = await params;
    const data = new AssetVersionService(defaultHubRepository).detail(
      decodeURIComponent(assetId),
      decodeURIComponent(versionId),
    );
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
