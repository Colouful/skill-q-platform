import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { checkApiRateLimit, getRequestIp } from "@/lib/api-rate-limit";
import { runUnifiedSearchCached } from "@/lib/search-result-cache";
import { type UnifiedSearchType } from "@/lib/unified-search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ip = getRequestIp(req);
    const rl = await checkApiRateLimit(`api:search:${ip}`, { max: 120, windowMs: 60_000 });
    if (!rl.ok) {
      return jsonErr("请求过于频繁，请稍后再试", 429);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const typeRaw = searchParams.get("type")?.trim().toLowerCase() ?? "all";
    const type: UnifiedSearchType =
      typeRaw === "skill" || typeRaw === "rule" || typeRaw === "all" ? typeRaw : "all";

    const { skills, rules } = await runUnifiedSearchCached(q, type);

    return jsonOk({
      q,
      type,
      skills,
      rules,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
