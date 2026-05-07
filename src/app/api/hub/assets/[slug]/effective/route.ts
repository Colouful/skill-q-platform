import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetInheritanceService } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const data = new AssetInheritanceService().effective(decodeURIComponent(slug));
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
