import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetGovernanceService, AssetQueryService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = await new AssetQueryService().list(new URL(req.url).searchParams);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = await new AssetGovernanceService().createDraft(body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
