import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AgentProfileSecurityService, defaultHubRepository } from "@/server/hub";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ profileId: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const data = new AgentProfileSecurityService(defaultHubRepository).validateProfile(profileId);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
