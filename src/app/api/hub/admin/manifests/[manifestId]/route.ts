import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { ManifestGovernanceService, ManifestQueryService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const data = await new ManifestQueryService().detail(decodeURIComponent(manifestId));
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = await new ManifestGovernanceService().updateDraft(decodeURIComponent(manifestId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
