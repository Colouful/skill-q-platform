import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestAssetBindingService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ manifestId: string; versionId: string; bindingId: string }> },
) {
  try {
    const { manifestId, versionId, bindingId } = await params;
    const data = new ManifestAssetBindingService(defaultHubRepository).unbind(
      decodeURIComponent(manifestId),
      decodeURIComponent(versionId),
      decodeURIComponent(bindingId),
    );
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
