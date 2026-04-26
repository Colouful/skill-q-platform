import { HubError } from "./errors";
import type { HubRepository } from "./repository";

function parsePagination(input: URLSearchParams | Record<string, string | undefined>) {
  const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
  const page = Number(get("page") ?? 1);
  const pageSize = Number(get("pageSize") ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new HubError("INVALID_PAGINATION", "分页参数不合法", "page 必须大于 0，pageSize 必须在 1 到 100 之间。", 400);
  }
  return { get, page, pageSize };
}

export class InstallRecordQueryService {
  constructor(private readonly repo: HubRepository) {}

  list(input: URLSearchParams | Record<string, string | undefined>) {
    const { get, page, pageSize } = parsePagination(input);
    const manifestSlug = (get("manifestSlug") ?? "").trim();
    const status = (get("status") ?? "").trim();
    const filtered = this.repo.installRecords.filter((record) => {
      if (manifestSlug && !String(record.manifestSlug ?? record.manifest.slug).includes(manifestSlug)) return false;
      if (status && record.status !== status) return false;
      return true;
    });
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((record) => ({
      id: record.id,
      projectId: record.projectId,
      workspaceId: record.workspaceId,
      manifestSlug: record.manifestSlug ?? record.manifest.slug,
      manifestVersion: record.manifestVersion ?? record.manifest.version,
      manifestChecksum: record.manifestChecksum ?? undefined,
      status: record.status ?? "accepted",
      failureReason: record.failureReason ?? undefined,
      packageCount: record.packageCount ?? record.packages.length,
      clientName: record.clientName ?? record.client.name,
      clientVersion: record.clientVersion ?? record.client.version,
      installedAt: record.installedAt,
      createdAt: record.createdAt,
    }));
    return { items, pagination: { page, pageSize, total } };
  }
}

export class RuntimeFeedbackQueryService {
  constructor(private readonly repo: HubRepository) {}

  list(input: URLSearchParams | Record<string, string | undefined>) {
    const { get, page, pageSize } = parsePagination(input);
    const manifestSlug = (get("manifestSlug") ?? "").trim();
    const success = get("success");
    const executorType = (get("executorType") ?? "").trim();
    const filtered = this.repo.runtimeFeedback.filter((record) => {
      if (manifestSlug && !String(record.manifestSlug ?? record.manifest.slug).includes(manifestSlug)) return false;
      if (success === "true" && record.success !== true) return false;
      if (success === "false" && record.success !== false) return false;
      if (executorType && record.executorType !== executorType) return false;
      return true;
    });
    const total = filtered.length;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((record) => ({
      id: record.id,
      projectId: record.projectId,
      runId: record.runId,
      manifestSlug: record.manifestSlug ?? record.manifest.slug,
      manifestVersion: record.manifestVersion ?? record.manifest.version,
      success: record.success ?? record.result.success,
      durationMs: record.durationMs ?? record.result.durationMs,
      executorType: record.executorType ?? record.executor,
      failureCategory: record.failureCategory ?? undefined,
      assetSlugs: record.assetSlugs ?? [],
      privacyChecked: record.privacyChecked ?? true,
      createdAt: record.createdAt,
    }));
    return { items, pagination: { page, pageSize, total } };
  }
}
