import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetVersionService, defaultHubRepository } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const data = new AssetVersionService(defaultHubRepository).list(decodeURIComponent(assetId));
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new AssetVersionService(defaultHubRepository).create(decodeURIComponent(assetId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
