import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestVersionService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const data = new ManifestVersionService(defaultHubRepository).list(decodeURIComponent(manifestId));
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new ManifestVersionService(defaultHubRepository).create(decodeURIComponent(manifestId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
