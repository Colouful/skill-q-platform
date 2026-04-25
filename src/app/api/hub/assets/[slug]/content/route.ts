import { hubException, hubSuccess } from "@/lib/hub-api-response";
import { AssetService, defaultHubRepository } from "@/server/hub";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const version = new URL(req.url).searchParams.get("version") ?? undefined;
    const data = new AssetService(defaultHubRepository).getPublishedContent({
      slug: decodeURIComponent(slug),
      version,
    });
    return hubSuccess(data);
  } catch (error) {
    return hubException(error);
  }
}
