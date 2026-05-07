import { randomUUID } from "node:crypto";
import { ASSET_ERROR } from "./asset-governance-errors";
import { assertNoSensitivePayload } from "./privacy-guard";
import type { HubRepository } from "./repository";
import { defaultHubRepository } from "./seed";

type AssetUsageFeedback = {
  feedbackId: string;
  assetId: string;
  assetType: string;
  runId: string;
  projectId: string;
  status: "success" | "failure" | "blocked" | "unknown";
  adopted: boolean;
  hookBlocked: boolean;
  testPassed: boolean;
  repairSucceeded: boolean;
  manualIntervention: boolean;
  timestamp: string;
};

const STORE = new WeakMap<HubRepository, AssetUsageFeedback[]>();

function getStore(repo: HubRepository) {
  const existing = STORE.get(repo);
  if (existing) return existing;
  const created: AssetUsageFeedback[] = [];
  STORE.set(repo, created);
  return created;
}

function readBoolean(metrics: Record<string, unknown>, key: string, fallback = false) {
  return typeof metrics[key] === "boolean" ? Boolean(metrics[key]) : fallback;
}

export class AssetQualityService {
  constructor(private readonly repo: HubRepository = defaultHubRepository) {}

  record(input: Record<string, unknown>) {
    assertNoSensitivePayload(input);
    const metrics = input.metrics && typeof input.metrics === "object" && !Array.isArray(input.metrics)
      ? (input.metrics as Record<string, unknown>)
      : input;
    const assetId = String(input.assetId ?? "");
    const asset = this.repo.assets.find((item) => item.id === assetId || item.slug === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    const status = this.normalizeStatus(input.status);
    const record: AssetUsageFeedback = {
      feedbackId: String(input.feedbackId ?? randomUUID()),
      assetId: asset.slug,
      assetType: String(input.assetType ?? asset.kind),
      runId: String(input.runId ?? ""),
      projectId: String(input.projectId ?? ""),
      status,
      adopted: readBoolean(metrics, "adopted"),
      hookBlocked: readBoolean(metrics, "hookBlocked"),
      testPassed: readBoolean(metrics, "testPassed"),
      repairSucceeded: readBoolean(metrics, "repairSucceeded"),
      manualIntervention: readBoolean(metrics, "manualIntervention"),
      timestamp: String(input.timestamp ?? new Date().toISOString()),
    };
    if (!record.runId || !record.projectId) {
      throw ASSET_ERROR.createInvalid("资产反馈 runId 和 projectId 不能为空");
    }
    getStore(this.repo).push(record);
    this.updateLatestVersionScore(asset.id);
    return {
      accepted: true,
      feedback: record,
      metrics: this.metrics(asset.slug),
    };
  }

  metrics(assetId: string) {
    const asset = this.repo.assets.find((item) => item.id === assetId || item.slug === assetId);
    if (!asset) throw ASSET_ERROR.notFound();
    const records = getStore(this.repo).filter((item) => item.assetId === asset.slug);
    const usageCount = records.length;
    const successCount = records.filter((item) => item.status === "success").length;
    const failureCount = records.filter((item) => item.status === "failure" || item.status === "blocked").length;
    const adoptedCount = records.filter((item) => item.adopted).length;
    const manualCount = records.filter((item) => item.manualIntervention).length;
    const blockedCount = records.filter((item) => item.hookBlocked || item.status === "blocked").length;
    const successRate = usageCount ? successCount / usageCount : 0;
    const failureRate = usageCount ? failureCount / usageCount : 0;
    const adoptionRate = usageCount ? adoptedCount / usageCount : 0;
    const riskScore = Math.min(100, Math.round(failureRate * 60 + (manualCount / Math.max(usageCount, 1)) * 25 + (blockedCount / Math.max(usageCount, 1)) * 15));
    const qualityScore = usageCount ? Math.max(0, Math.min(100, Math.round(successRate * 70 + adoptionRate * 20 - riskScore * 0.2 + 10))) : 0;
    return {
      assetId: asset.slug,
      usageCount,
      successRate,
      failureRate,
      adoptionRate,
      lastUsedAt: records.map((item) => item.timestamp).sort().at(-1) ?? null,
      riskScore,
      qualityScore,
    };
  }

  private updateLatestVersionScore(assetId: string) {
    const asset = this.repo.assets.find((item) => item.id === assetId);
    if (!asset) return;
    const version = this.repo.assetVersions.find((item) => item.id === asset.latestVersionId)
      ?? this.repo.assetVersions.find((item) => item.assetId === asset.id && item.status === "published");
    if (!version) return;
    version.qualityScore = this.metrics(asset.slug).qualityScore;
  }

  private normalizeStatus(value: unknown): AssetUsageFeedback["status"] {
    const status = String(value ?? "unknown");
    if (status === "success" || status === "failure" || status === "blocked" || status === "unknown") return status;
    return "unknown";
  }
}
