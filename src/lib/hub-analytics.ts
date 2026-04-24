import { prisma } from "@/lib/prisma";

type HubRuntimeStatus = "success" | "failed" | "partial" | string;

export interface HubAnalyticsAssetRef {
  kind: string;
  assetId: string;
  version: string;
}

export interface HubAnalyticsManifestSource {
  manifestId: string;
  displayName?: string | null;
  status?: string | null;
  assets?: HubAnalyticsAssetRef[];
}

export interface HubAnalyticsAssetSource {
  kind: string;
  assetId: string;
  displayName?: string | null;
  riskLevel?: string | null;
  status?: string | null;
}

export interface HubAnalyticsInstallSource {
  projectName: string;
  manifestId: string;
  manifestVersion: string;
  status: string;
  createdAt?: Date | string | null;
}

export interface HubAnalyticsRuntimeSource {
  projectName: string;
  manifestId?: string | null;
  manifestVersion?: string | null;
  runId: string;
  status: HubRuntimeStatus;
  usedAssets?: HubAnalyticsAssetRef[] | unknown;
  durationMs?: number | null;
  failedReason?: string | null;
  createdAt?: Date | string | null;
}

export interface HubAnalyticsResult {
  summary: {
    manifestCount: number;
    assetCount: number;
    installedProjects: number;
    installCount: number;
    runCount: number;
    successRunCount: number;
    failedRunCount: number;
    partialRunCount: number;
    successRate: number;
    avgDurationMs: number;
    highRiskAssetCount: number;
  };
  manifests: Array<{
    manifestId: string;
    displayName: string;
    status: string;
    installedProjects: number;
    installCount: number;
    runCount: number;
    successRunCount: number;
    failedRunCount: number;
    partialRunCount: number;
    successRate: number;
    avgDurationMs: number;
    latestRuntimeAt: string | null;
    recommendationGrade: string;
    commonFailureReasons: Array<{ reason: string; count: number }>;
  }>;
  assets: Array<{
    kind: string;
    assetId: string;
    displayName: string;
    riskLevel: string;
    status: string;
    projectCoverage: number;
    runCount: number;
    successRunCount: number;
    failedRunCount: number;
    successRate: number;
    recommendationGrade: string;
    commonFailureReasons: Array<{ reason: string; count: number }>;
  }>;
  governance: {
    failingManifests: Array<{ manifestId: string; failedRunCount: number; successRate: number }>;
    riskyAssets: Array<{ kind: string; assetId: string; riskLevel: string }>;
    topFailureReasons: Array<{ reason: string; count: number }>;
    uninstalledPublishedManifests: string[];
  };
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function successRate(success: number, total: number) {
  if (total <= 0) return 0;
  return Number((success / total).toFixed(4));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function grade(rate: number, total: number) {
  if (total === 0) return "N/A";
  if (rate >= 0.9) return "A";
  if (rate >= 0.75) return "B";
  if (rate >= 0.6) return "C";
  return "D";
}

function addFailureReason(map: Map<string, number>, reason?: string | null) {
  const normalized = String(reason || "未提供失败原因").trim() || "未提供失败原因";
  map.set(normalized, (map.get(normalized) || 0) + 1);
}

function topReasons(map: Map<string, number>, take = 5) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, take)
    .map(([reason, count]) => ({ reason, count }));
}

function normalizeUsedAssets(value: unknown): HubAnalyticsAssetRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const kind = typeof record.kind === "string" ? record.kind : "";
      const assetId =
        typeof record.assetId === "string"
          ? record.assetId
          : typeof record.slug === "string"
            ? record.slug
            : typeof record.id === "string"
              ? record.id
              : "";
      const version = typeof record.version === "string" ? record.version : "";
      return kind && assetId ? { kind, assetId, version } : null;
    })
    .filter((item): item is HubAnalyticsAssetRef => Boolean(item));
}

function assetKey(asset: Pick<HubAnalyticsAssetRef, "kind" | "assetId">) {
  return `${asset.kind}:${asset.assetId}`;
}

function isFailed(status: HubRuntimeStatus) {
  return status === "failed" || status === "partial";
}

export function buildHubAnalytics(input: {
  manifests: HubAnalyticsManifestSource[];
  assets: HubAnalyticsAssetSource[];
  installs: HubAnalyticsInstallSource[];
  runtimes: HubAnalyticsRuntimeSource[];
}): HubAnalyticsResult {
  const installedProjects = new Set(input.installs.map((install) => install.projectName));
  const globalFailureReasons = new Map<string, number>();
  const successRunCount = input.runtimes.filter((runtime) => runtime.status === "success").length;
  const failedRunCount = input.runtimes.filter((runtime) => runtime.status === "failed").length;
  const partialRunCount = input.runtimes.filter((runtime) => runtime.status === "partial").length;
  for (const runtime of input.runtimes) {
    if (isFailed(runtime.status)) addFailureReason(globalFailureReasons, runtime.failedReason);
  }

  const manifests = input.manifests.map((manifest) => {
    const installs = input.installs.filter((install) => install.manifestId === manifest.manifestId);
    const runtimes = input.runtimes.filter((runtime) => runtime.manifestId === manifest.manifestId);
    const projectNames = new Set(installs.map((install) => install.projectName));
    const manifestFailureReasons = new Map<string, number>();
    for (const runtime of runtimes) {
      if (isFailed(runtime.status)) addFailureReason(manifestFailureReasons, runtime.failedReason);
    }
    const success = runtimes.filter((runtime) => runtime.status === "success").length;
    const rate = successRate(success, runtimes.length);
    const latestRuntimeAt = runtimes
      .map((runtime) => toIso(runtime.createdAt))
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
    return {
      manifestId: manifest.manifestId,
      displayName: manifest.displayName || manifest.manifestId,
      status: manifest.status || "unknown",
      installedProjects: projectNames.size,
      installCount: installs.length,
      runCount: runtimes.length,
      successRunCount: success,
      failedRunCount: runtimes.filter((runtime) => runtime.status === "failed").length,
      partialRunCount: runtimes.filter((runtime) => runtime.status === "partial").length,
      successRate: rate,
      avgDurationMs: average(runtimes.map((runtime) => Number(runtime.durationMs || 0))),
      latestRuntimeAt,
      recommendationGrade: grade(rate, runtimes.length),
      commonFailureReasons: topReasons(manifestFailureReasons),
    };
  });

  const assets = input.assets.map((asset) => {
    const key = assetKey(asset);
    const matchedRuntimes = input.runtimes.filter((runtime) =>
      normalizeUsedAssets(runtime.usedAssets).some((usedAsset) => assetKey(usedAsset) === key),
    );
    const coveredProjects = new Set(matchedRuntimes.map((runtime) => runtime.projectName));
    const failureReasons = new Map<string, number>();
    for (const runtime of matchedRuntimes) {
      if (isFailed(runtime.status)) addFailureReason(failureReasons, runtime.failedReason);
    }
    const success = matchedRuntimes.filter((runtime) => runtime.status === "success").length;
    const rate = successRate(success, matchedRuntimes.length);
    return {
      kind: asset.kind,
      assetId: asset.assetId,
      displayName: asset.displayName || asset.assetId,
      riskLevel: asset.riskLevel || "L0",
      status: asset.status || "unknown",
      projectCoverage: coveredProjects.size,
      runCount: matchedRuntimes.length,
      successRunCount: success,
      failedRunCount: matchedRuntimes.filter((runtime) => runtime.status === "failed").length,
      successRate: rate,
      recommendationGrade: grade(rate, matchedRuntimes.length),
      commonFailureReasons: topReasons(failureReasons),
    };
  });

  const installedManifestIds = new Set(input.installs.map((install) => install.manifestId));

  return {
    summary: {
      manifestCount: input.manifests.length,
      assetCount: input.assets.length,
      installedProjects: installedProjects.size,
      installCount: input.installs.length,
      runCount: input.runtimes.length,
      successRunCount,
      failedRunCount,
      partialRunCount,
      successRate: successRate(successRunCount, input.runtimes.length),
      avgDurationMs: average(input.runtimes.map((runtime) => Number(runtime.durationMs || 0))),
      highRiskAssetCount: input.assets.filter((asset) => ["L3", "L4"].includes(asset.riskLevel || "L0")).length,
    },
    manifests: manifests.sort((left, right) => right.runCount - left.runCount || right.installCount - left.installCount),
    assets: assets.sort((left, right) => right.runCount - left.runCount || left.assetId.localeCompare(right.assetId)),
    governance: {
      failingManifests: manifests
        .filter((manifest) => manifest.failedRunCount > 0 || manifest.partialRunCount > 0)
        .map((manifest) => ({
          manifestId: manifest.manifestId,
          failedRunCount: manifest.failedRunCount + manifest.partialRunCount,
          successRate: manifest.successRate,
        })),
      riskyAssets: input.assets
        .filter((asset) => ["L3", "L4"].includes(asset.riskLevel || "L0"))
        .map((asset) => ({
          kind: asset.kind,
          assetId: asset.assetId,
          riskLevel: asset.riskLevel || "L0",
        })),
      topFailureReasons: topReasons(globalFailureReasons),
      uninstalledPublishedManifests: input.manifests
        .filter((manifest) => manifest.status === "published" && !installedManifestIds.has(manifest.manifestId))
        .map((manifest) => manifest.manifestId),
    },
  };
}

function isMissingHubTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  return (
    maybe.code === "P2021" ||
    maybe.code === "P2022" ||
    /hub_(asset|manifest|install|runtime)|doesn't exist|does not exist|Unknown table/i.test(
      maybe.message || "",
    )
  );
}

export async function getHubAnalytics(): Promise<HubAnalyticsResult> {
  try {
    const db = prisma as any;
    const [manifests, assets, installs, runtimes] = await Promise.all([
      db.hubManifest.findMany({
        include: { assets: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      db.hubAsset.findMany({
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      db.hubInstallRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      db.hubRuntimeReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
    ]);

    return buildHubAnalytics({
      manifests: manifests.map((manifest: any) => ({
        manifestId: manifest.manifestId,
        displayName: manifest.displayName,
        status: manifest.status,
        assets: manifest.assets,
      })),
      assets: assets.map((asset: any) => ({
        kind: asset.kind,
        assetId: asset.assetId,
        displayName: asset.displayName,
        riskLevel: asset.riskLevel,
        status: asset.status,
      })),
      installs,
      runtimes,
    });
  } catch (error) {
    if (isMissingHubTable(error)) {
      return buildHubAnalytics({ manifests: [], assets: [], installs: [], runtimes: [] });
    }
    throw error;
  }
}
