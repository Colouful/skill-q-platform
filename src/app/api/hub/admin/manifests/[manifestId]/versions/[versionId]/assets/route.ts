import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestAssetBindingService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ manifestId: string; versionId: string }> }) {
  try {
    const { manifestId, versionId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new ManifestAssetBindingService(defaultHubRepository).bind(
      decodeURIComponent(manifestId),
      decodeURIComponent(versionId),
      body,
    );
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
