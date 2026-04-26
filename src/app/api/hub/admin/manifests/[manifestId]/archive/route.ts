import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { ManifestGovernanceService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ manifestId: string }> }) {
  try {
    const { manifestId } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = await new ManifestGovernanceService().archive(decodeURIComponent(manifestId), body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
