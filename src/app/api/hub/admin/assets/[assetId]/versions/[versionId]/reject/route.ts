import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ReviewWorkflowService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ assetId: string; versionId: string }> }) {
  try {
    const { assetId, versionId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new ReviewWorkflowService(defaultHubRepository).rejectAssetVersion(
      decodeURIComponent(assetId),
      decodeURIComponent(versionId),
      body,
    );
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
