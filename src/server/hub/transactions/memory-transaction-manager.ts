import type { HubAuditLog } from "../audit-log-types";
import { createHubRepository, type HubRepository } from "../repository";
import { InMemoryHubRepositoryAdapter } from "../repositories/memory/in-memory-hub-repository-adapter";
import type { HubTransactionContext } from "./transaction-context";
import type { TransactionManagerPort } from "./transaction-manager-port";

type HubRepositorySnapshot = Pick<
  HubRepository,
  "assets" | "assetVersions" | "manifests" | "manifestVersions" | "manifestAssets" | "agentProfiles" | "installRecords" | "runtimeFeedback"
>;

function cloneSnapshot(repo: HubRepository): HubRepositorySnapshot {
  return {
    assets: structuredClone(repo.assets),
    assetVersions: structuredClone(repo.assetVersions),
    manifests: structuredClone(repo.manifests),
    manifestVersions: structuredClone(repo.manifestVersions),
    manifestAssets: structuredClone(repo.manifestAssets),
    agentProfiles: structuredClone(repo.agentProfiles),
    installRecords: structuredClone(repo.installRecords),
    runtimeFeedback: structuredClone(repo.runtimeFeedback),
  };
}

function restoreSnapshot(repo: HubRepository, snapshot: HubRepositorySnapshot) {
  repo.assets.splice(0, repo.assets.length, ...structuredClone(snapshot.assets));
  repo.assetVersions.splice(0, repo.assetVersions.length, ...structuredClone(snapshot.assetVersions));
  repo.manifests.splice(0, repo.manifests.length, ...structuredClone(snapshot.manifests));
  repo.manifestVersions.splice(0, repo.manifestVersions.length, ...structuredClone(snapshot.manifestVersions));
  repo.manifestAssets.splice(0, repo.manifestAssets.length, ...structuredClone(snapshot.manifestAssets));
  repo.agentProfiles.splice(0, repo.agentProfiles.length, ...structuredClone(snapshot.agentProfiles));
  repo.installRecords.splice(0, repo.installRecords.length, ...structuredClone(snapshot.installRecords));
  repo.runtimeFeedback.splice(0, repo.runtimeFeedback.length, ...structuredClone(snapshot.runtimeFeedback));
}

export class MemoryTransactionManager implements TransactionManagerPort {
  readonly adapter: InMemoryHubRepositoryAdapter;

  constructor(readonly repo: HubRepository = createHubRepository(), adapter?: InMemoryHubRepositoryAdapter) {
    this.adapter = adapter ?? new InMemoryHubRepositoryAdapter(repo);
  }

  async runInTransaction<T>(handler: (tx: HubTransactionContext) => Promise<T>): Promise<T> {
    const snapshot = cloneSnapshot(this.repo);
    const auditSnapshot: HubAuditLog[] = this.adapter.getAuditLogsSnapshot();
    try {
      return await handler({
        assets: this.adapter,
        assetVersions: this.adapter,
        manifests: this.adapter,
        manifestVersions: this.adapter,
        manifestAssetBindings: this.adapter,
        agentProfiles: this.adapter,
        auditLogs: this.adapter,
      });
    } catch (error) {
      restoreSnapshot(this.repo, snapshot);
      this.adapter.restoreAuditLogs(auditSnapshot);
      throw error;
    }
  }
}
