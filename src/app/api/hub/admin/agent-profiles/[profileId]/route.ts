import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AgentProfileGovernanceService, AgentProfileQueryService, defaultHubRepository } from "@/server/hub";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ profileId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const data = new AgentProfileQueryService(defaultHubRepository).detail(profileId);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = new AgentProfileGovernanceService(defaultHubRepository).updateDraft(profileId, body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
