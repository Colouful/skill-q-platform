import type { AgentProfileRepositoryPort } from "./agent-profile-repository-port";
import type { AssetRepositoryPort } from "./asset-repository-port";
import type { AssetVersionRepositoryPort } from "./asset-version-repository-port";
import type { AuditLogRepositoryPort } from "./audit-log-repository-port";
import type { ManifestAssetBindingRepositoryPort } from "./manifest-asset-binding-repository-port";
import type { ManifestRepositoryPort } from "./manifest-repository-port";
import type { ManifestVersionRepositoryPort } from "./manifest-version-repository-port";
import type { TelemetryRepositoryPort } from "./telemetry-repository-port";

export type HubRepositoryPort = AssetRepositoryPort &
  AssetVersionRepositoryPort &
  ManifestRepositoryPort &
  ManifestVersionRepositoryPort &
  ManifestAssetBindingRepositoryPort &
  AgentProfileRepositoryPort &
  TelemetryRepositoryPort &
  AuditLogRepositoryPort;
