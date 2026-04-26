export type HubAdminApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: null | {
    code: string;
    message: string;
    suggestion: string;
  };
  requestId: string;
  timestamp: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type ListResult<T> = {
  items: T[];
  pagination: Pagination;
};

export type HubAssetListItem = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
  kind: string;
  scope: string;
  status: string;
};

export type HubManifestListItem = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
  scope: string;
  status: string;
};

export type HubAgentProfileListItem = Record<string, unknown> & {
  id: string;
  slug: string;
  name: string;
  version: string;
  status: string;
};

export type HubTelemetryItem = Record<string, unknown> & {
  id: string;
};

export type HubAuditLogItem = Record<string, unknown> & {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  operator: string;
  createdAt: string;
};

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function requestHubAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json()) as HubAdminApiResponse<T>;
  if (!payload.success || !response.ok) {
    const message = payload.error?.message || "Hub 请求失败";
    const suggestion = payload.error?.suggestion ? ` ${payload.error.suggestion}` : "";
    throw new Error(`${message}${suggestion}`);
  }
  return payload.data as T;
}

function json(method: "POST" | "PATCH" | "DELETE", body?: unknown): RequestInit {
  return {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function listAssets(query?: Query) {
  return requestHubAdmin<ListResult<HubAssetListItem>>(buildUrl("/api/hub/admin/assets", query));
}

export function createAsset(input: Record<string, unknown>) {
  return requestHubAdmin<{ asset: Record<string, unknown> }>("/api/hub/admin/assets", json("POST", input));
}

export function getAssetDetail(assetId: string) {
  return requestHubAdmin<Record<string, unknown>>(`/api/hub/admin/assets/${assetId}`);
}

export function updateAsset(assetId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ asset: Record<string, unknown> }>(`/api/hub/admin/assets/${assetId}`, json("PATCH", input));
}

export function createAssetVersion(assetId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(`/api/hub/admin/assets/${assetId}/versions`, json("POST", input));
}

export function publishAssetVersion(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/assets/${assetId}/versions/${versionId}/publish`,
    json("POST", input),
  );
}

export function submitAssetVersionReview(assetId: string, versionId: string, input: Record<string, unknown> = {}) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/assets/${assetId}/versions/${versionId}/submit-review`,
    json("POST", input),
  );
}

export function rejectAssetVersion(assetId: string, versionId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/assets/${assetId}/versions/${versionId}/reject`,
    json("POST", input),
  );
}

export function deprecateAssetVersion(assetId: string, versionId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/assets/${assetId}/versions/${versionId}/deprecate`,
    json("POST", input),
  );
}

export function archiveAsset(assetId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ asset: Record<string, unknown> }>(`/api/hub/admin/assets/${assetId}/archive`, json("POST", input));
}

export function listManifests(query?: Query) {
  return requestHubAdmin<ListResult<HubManifestListItem>>(buildUrl("/api/hub/admin/manifests", query));
}

export function createManifest(input: Record<string, unknown>) {
  return requestHubAdmin<{ manifest: Record<string, unknown> }>("/api/hub/admin/manifests", json("POST", input));
}

export function getManifestDetail(manifestId: string) {
  return requestHubAdmin<Record<string, unknown>>(`/api/hub/admin/manifests/${manifestId}`);
}

export function updateManifest(manifestId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ manifest: Record<string, unknown> }>(`/api/hub/admin/manifests/${manifestId}`, json("PATCH", input));
}

export function createManifestVersion(manifestId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(`/api/hub/admin/manifests/${manifestId}/versions`, json("POST", input));
}

export function bindManifestAsset(manifestId: string, versionId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ binding: Record<string, unknown> }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets`,
    json("POST", input),
  );
}

export function unbindManifestAsset(manifestId: string, versionId: string, bindingId: string) {
  return requestHubAdmin<{ removed: boolean }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets/${bindingId}`,
    json("DELETE"),
  );
}

export function reorderManifestAssets(manifestId: string, versionId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ items: Array<Record<string, unknown>> }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/assets/reorder`,
    json("PATCH", input),
  );
}

export function publishManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/publish`,
    json("POST", input),
  );
}

export function submitManifestVersionReview(manifestId: string, versionId: string, input: Record<string, unknown> = {}) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/submit-review`,
    json("POST", input),
  );
}

export function rejectManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/reject`,
    json("POST", input),
  );
}

export function deprecateManifestVersion(manifestId: string, versionId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ version: Record<string, unknown> }>(
    `/api/hub/admin/manifests/${manifestId}/versions/${versionId}/deprecate`,
    json("POST", input),
  );
}

export function archiveManifest(manifestId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ manifest: Record<string, unknown> }>(`/api/hub/admin/manifests/${manifestId}/archive`, json("POST", input));
}

export function listAgentProfiles(query?: Query) {
  return requestHubAdmin<ListResult<HubAgentProfileListItem>>(buildUrl("/api/hub/admin/agent-profiles", query));
}

export function createAgentProfile(input: Record<string, unknown>) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>("/api/hub/admin/agent-profiles", json("POST", input));
}

export function getAgentProfileDetail(profileId: string) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(`/api/hub/admin/agent-profiles/${profileId}`);
}

export function updateAgentProfile(profileId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(`/api/hub/admin/agent-profiles/${profileId}`, json("PATCH", input));
}

export function publishAgentProfile(profileId: string, input: Record<string, unknown> = {}) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(`/api/hub/admin/agent-profiles/${profileId}/publish`, json("POST", input));
}

export function submitAgentProfileReview(profileId: string, input: Record<string, unknown> = {}) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(
    `/api/hub/admin/agent-profiles/${profileId}/submit-review`,
    json("POST", input),
  );
}

export function rejectAgentProfile(profileId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(
    `/api/hub/admin/agent-profiles/${profileId}/reject`,
    json("POST", input),
  );
}

export function deprecateAgentProfile(profileId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(`/api/hub/admin/agent-profiles/${profileId}/deprecate`, json("POST", input));
}

export function archiveAgentProfile(profileId: string, input: Record<string, unknown>) {
  return requestHubAdmin<{ profile: Record<string, unknown> }>(`/api/hub/admin/agent-profiles/${profileId}/archive`, json("POST", input));
}

export function validateAgentProfile(profileId: string) {
  return requestHubAdmin<{ valid: boolean; errors: Array<Record<string, unknown>>; warnings: Array<Record<string, unknown>> }>(
    `/api/hub/admin/agent-profiles/${profileId}/validate`,
    json("POST", {}),
  );
}

export function listInstallRecords(query?: Query) {
  return requestHubAdmin<ListResult<HubTelemetryItem>>(buildUrl("/api/hub/admin/install-records", query));
}

export function listRuntimeFeedback(query?: Query) {
  return requestHubAdmin<ListResult<HubTelemetryItem>>(buildUrl("/api/hub/admin/runtime-feedback", query));
}

export function listAuditLogs(query?: Query) {
  return requestHubAdmin<ListResult<HubAuditLogItem>>(buildUrl("/api/hub/admin/audit-logs", query));
}
