import { reportHubRuntime } from "@/lib/hub-service";
import { hubOk, toHubResponse } from "@/lib/hub-response";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = await reportHubRuntime({
      projectName: body.projectName || body.projectId || "unknown-project",
      repoUrl: body.repositoryUrl,
      manifestId: body.manifest?.slug || body.manifestSlug,
      manifestVersion: body.manifest?.version || body.manifestVersion,
      runId: `snapshot-${body.projectId || crypto.randomUUID()}`,
      stage: "review",
      status: "success",
      usedAssets: Array.isArray(body.assets) ? body.assets : [],
      durationMs: 0,
      failedReason: undefined,
    });
    return hubOk(record, "项目资产快照已上报", req);
  } catch (error) {
    return toHubResponse(error, req);
  }
}
