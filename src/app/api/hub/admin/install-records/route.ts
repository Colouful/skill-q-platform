import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { defaultHubRepository, InstallRecordQueryService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = new InstallRecordQueryService(defaultHubRepository).list(new URL(req.url).searchParams);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
