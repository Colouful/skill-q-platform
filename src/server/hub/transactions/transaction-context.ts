import type { AssetRepositoryPort } from "../repositories/ports/asset-repository-port";
import type { AssetVersionRepositoryPort } from "../repositories/ports/asset-version-repository-port";
import type { AuditLogRepositoryPort } from "../repositories/ports/audit-log-repository-port";
import type { ManifestAssetBindingRepositoryPort } from "../repositories/ports/manifest-asset-binding-repository-port";
import type { ManifestRepositoryPort } from "../repositories/ports/manifest-repository-port";
import type { ManifestVersionRepositoryPort } from "../repositories/ports/manifest-version-repository-port";
import type { AgentProfileRepositoryPort } from "../repositories/ports/agent-profile-repository-port";

export interface HubTransactionContext {
  assets: AssetRepositoryPort;
  assetVersions: AssetVersionRepositoryPort;
  manifests: ManifestRepositoryPort;
  manifestVersions: ManifestVersionRepositoryPort;
  manifestAssetBindings: ManifestAssetBindingRepositoryPort;
  agentProfiles: AgentProfileRepositoryPort;
  auditLogs: AuditLogRepositoryPort;
}
