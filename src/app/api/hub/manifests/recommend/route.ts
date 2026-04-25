import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, ManifestRecommendService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = new ManifestRecommendService(defaultHubRepository).recommend({
      workspace: body.workspace,
      projectFacts: Array.isArray(body.projectFacts) ? (body.projectFacts as Array<Record<string, unknown>>) : [],
    });
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
