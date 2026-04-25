import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestExportService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const searchParams = new URL(req.url).searchParams;
    const data = new ManifestExportService(defaultHubRepository).export({
      slug: decodeURIComponent(manifestId),
      version: searchParams.get("version") ?? undefined,
      teamId: searchParams.get("teamId") ?? undefined,
    });
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
