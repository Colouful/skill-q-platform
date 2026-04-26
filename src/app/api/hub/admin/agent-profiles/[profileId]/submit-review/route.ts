import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ReviewWorkflowService } from "@/server/hub";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ profileId: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const { profileId } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;
    const data = await new ReviewWorkflowService(defaultHubRepository).submitAgentProfile(profileId, body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
