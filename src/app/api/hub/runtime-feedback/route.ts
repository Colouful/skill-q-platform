import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, RuntimeFeedbackService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = new RuntimeFeedbackService(defaultHubRepository).record(body);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
