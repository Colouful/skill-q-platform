import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestGovernanceService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new ManifestGovernanceService(defaultHubRepository).archive(decodeURIComponent(manifestId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
