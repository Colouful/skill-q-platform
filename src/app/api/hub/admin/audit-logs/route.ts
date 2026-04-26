import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AuditLogService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const data = new AuditLogService().list(new URL(req.url).searchParams);
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
