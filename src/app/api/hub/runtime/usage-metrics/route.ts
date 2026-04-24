import { reportHubRuntime } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = await reportHubRuntime({
      projectName: body.projectId || "unknown-project",
      manifestId: body.manifestSlug,
      manifestVersion: body.manifestVersion,
      runId: `usage-${body.period || "daily"}-${crypto.randomUUID()}`,
      stage: "review",
      status: Number(body.metrics?.failedRunCount || 0) > 0 ? "partial" : "success",
      usedAssets: [],
      durationMs: Number(body.metrics?.avgDurationMs || 0),
      failedReason: undefined,
    });
    return hubOk(record, "运行指标已上报", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
