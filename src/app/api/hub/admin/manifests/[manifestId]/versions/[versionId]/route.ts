import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { ManifestVersionService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ manifestId: string; versionId: string }> }) {
  try {
    const { manifestId, versionId } = await params;
    const data = await new ManifestVersionService().detail(
      decodeURIComponent(manifestId),
      decodeURIComponent(versionId),
    );
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
