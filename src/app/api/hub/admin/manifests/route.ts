import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestGovernanceService, ManifestQueryService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = new ManifestQueryService(defaultHubRepository).list(new URL(req.url).searchParams);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = new ManifestGovernanceService(defaultHubRepository).createDraft(body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
