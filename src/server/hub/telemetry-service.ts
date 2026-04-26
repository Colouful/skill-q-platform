import { randomUUID } from "node:crypto";
import { HubRepository } from "./repository";
import { assertNoSensitivePayload } from "./privacy-guard";

export class InstallRecordService {
  constructor(private readonly repo: HubRepository) {}

  record(input: Record<string, unknown>) {
    assertNoSensitivePayload(input);
    const projectId = String(input.projectId ?? "");
    const manifest = input.manifest as { slug?: string; version?: string } | undefined;
    const existing = this.repo.installRecords.find(
      (item) => item.projectId === projectId && item.manifest.slug === manifest?.slug && item.manifest.version === manifest?.version,
    );
    if (existing) return existing;
    const record = {
      accepted: true,
      id: randomUUID(),
      projectId,
      workspaceId: input.workspaceId ? String(input.workspaceId) : null,
      manifest: {
        slug: String(manifest?.slug ?? ""),
        version: String(manifest?.version ?? ""),
      },
      packages: Array.isArray(input.packages) ? input.packages : [],
      manifestSlug: String(manifest?.slug ?? ""),
      manifestVersion: String(manifest?.version ?? ""),
      manifestChecksum: String((manifest as { checksum?: string } | undefined)?.checksum ?? ""),
      status: String(input.status ?? "accepted"),
      failureReason: input.failureReason ? String(input.failureReason) : null,
      packageCount: Array.isArray(input.packages) ? input.packages.length : 0,
      installedAt: String(input.installedAt ?? new Date().toISOString()),
      client: {
        name: String((input.client as { name?: string } | undefined)?.name ?? "br-ai-spec"),
        version: String((input.client as { version?: string } | undefined)?.version ?? ""),
      },
      clientName: String((input.client as { name?: string } | undefined)?.name ?? "br-ai-spec"),
      clientVersion: String((input.client as { version?: string } | undefined)?.version ?? ""),
      createdAt: new Date().toISOString(),
    };
    this.repo.installRecords.push(record);
    return record;
  }
}

export class RuntimeFeedbackService {
  constructor(private readonly repo: HubRepository) {}

  record(input: Record<string, unknown>) {
    assertNoSensitivePayload(input);
    const manifest = input.manifest as { slug?: string; version?: string } | undefined;
    const result = input.result as { status?: string; success?: boolean; durationMs?: number } | undefined;
    const assetsUsed = Array.isArray(input.assetsUsed) ? input.assetsUsed : [];
    const record = {
      accepted: true,
      id: randomUUID(),
      projectId: String(input.projectId ?? ""),
      runId: String(input.runId ?? ""),
      manifest: {
        slug: String(manifest?.slug ?? ""),
        version: String(manifest?.version ?? ""),
      },
      assetsUsed,
      executor: String(input.executor ?? ""),
      result: {
        status: String(result?.status ?? ""),
        success: Boolean(result?.success),
        durationMs: Number(result?.durationMs ?? 0),
      },
      issues: Array.isArray(input.issues) ? input.issues : [],
      manifestSlug: String(manifest?.slug ?? ""),
      manifestVersion: String(manifest?.version ?? ""),
      success: Boolean(result?.success),
      durationMs: Number(result?.durationMs ?? 0),
      failureCategory: input.failureCategory ? String(input.failureCategory) : null,
      executorType: String(input.executor ?? ""),
      assetSlugs: assetsUsed
        .map((item) => (item && typeof item === "object" ? String((item as { slug?: unknown }).slug ?? "") : ""))
        .filter(Boolean),
      privacyChecked: true,
      createdAt: new Date().toISOString(),
    };
    this.repo.runtimeFeedback.push(record);
    return record;
  }
}
