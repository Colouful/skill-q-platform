import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AgentProfileGovernanceService, AgentProfileQueryService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = await new AgentProfileQueryService().list(new URL(req.url).searchParams);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = await new AgentProfileGovernanceService().createDraft(body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
