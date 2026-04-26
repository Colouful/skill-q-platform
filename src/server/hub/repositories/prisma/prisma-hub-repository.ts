import type { HubRepositoryPort } from "../ports/hub-repository-port";
import type {
  AuditLogListQuery,
  HubAuditLogCreateInput,
  PrismaHubClientLike,
} from "../repository-types";
import { PrismaAgentProfileRepository } from "./prisma-agent-profile-repository";
import { PrismaAuditLogRepository } from "./prisma-audit-log-repository";
import { PrismaAssetRepository } from "./prisma-asset-repository";
import { PrismaAssetVersionRepository } from "./prisma-asset-version-repository";
import { PrismaManifestRepository } from "./prisma-manifest-repository";
import { PrismaTelemetryRepository } from "./prisma-telemetry-repository";

export class PrismaHubRepository implements HubRepositoryPort {
  private readonly assets: PrismaAssetRepository;
  private readonly assetVersions: PrismaAssetVersionRepository;
  private readonly manifests: PrismaManifestRepository;
  private readonly agentProfiles: PrismaAgentProfileRepository;
  private readonly telemetry: PrismaTelemetryRepository;
  private readonly auditLogs: PrismaAuditLogRepository;

  constructor(private readonly prisma: PrismaHubClientLike) {
    this.assets = new PrismaAssetRepository(prisma);
    this.assetVersions = new PrismaAssetVersionRepository(prisma);
    this.manifests = new PrismaManifestRepository(prisma);
    this.agentProfiles = new PrismaAgentProfileRepository(prisma);
    this.telemetry = new PrismaTelemetryRepository(prisma);
    this.auditLogs = new PrismaAuditLogRepository(prisma);
  }

  listAssets(...args: Parameters<PrismaAssetRepository["listAssets"]>) {
    return this.assets.listAssets(...args);
  }

  findAssetById(...args: Parameters<PrismaAssetRepository["findAssetById"]>) {
    return this.assets.findAssetById(...args);
  }

  findAssetBySlug(...args: Parameters<PrismaAssetRepository["findAssetBySlug"]>) {
    return this.assets.findAssetBySlug(...args);
  }

  listAssetVersions(...args: Parameters<PrismaAssetRepository["listAssetVersions"]>) {
    return this.assets.listAssetVersions(...args);
  }

  findAssetVersionById(...args: Parameters<PrismaAssetRepository["findAssetVersionById"]>) {
    return this.assets.findAssetVersionById(...args);
  }

  listAssetManifestRefs(...args: Parameters<PrismaAssetRepository["listAssetManifestRefs"]>) {
    return this.assets.listAssetManifestRefs(...args);
  }

  createAsset(...args: Parameters<PrismaAssetRepository["createAsset"]>) {
    return this.assets.createAsset(...args);
  }

  updateAssetDraft(...args: Parameters<PrismaAssetRepository["updateAssetDraft"]>) {
    return this.assets.updateAssetDraft(...args);
  }

  archiveAsset(...args: Parameters<PrismaAssetRepository["archiveAsset"]>) {
    return this.assets.archiveAsset(...args);
  }

  markAssetPublished(...args: Parameters<PrismaAssetRepository["markAssetPublished"]>) {
    return this.assets.markAssetPublished(...args);
  }

  createAssetVersion(...args: Parameters<PrismaAssetVersionRepository["createAssetVersion"]>) {
    return this.assetVersions.createAssetVersion(...args);
  }

  findAssetVersionByAssetAndId(...args: Parameters<PrismaAssetVersionRepository["findAssetVersionByAssetAndId"]>) {
    return this.assetVersions.findAssetVersionByAssetAndId(...args);
  }

  findAssetVersionByAssetAndVersion(...args: Parameters<PrismaAssetVersionRepository["findAssetVersionByAssetAndVersion"]>) {
    return this.assetVersions.findAssetVersionByAssetAndVersion(...args);
  }

  publishAssetVersion(...args: Parameters<PrismaAssetVersionRepository["publishAssetVersion"]>) {
    return this.assetVersions.publishAssetVersion(...args);
  }

  deprecateAssetVersion(...args: Parameters<PrismaAssetVersionRepository["deprecateAssetVersion"]>) {
    return this.assetVersions.deprecateAssetVersion(...args);
  }

  listManifests(...args: Parameters<PrismaManifestRepository["listManifests"]>) {
    return this.manifests.listManifests(...args);
  }

  findManifestById(...args: Parameters<PrismaManifestRepository["findManifestById"]>) {
    return this.manifests.findManifestById(...args);
  }

  findManifestBySlug(...args: Parameters<PrismaManifestRepository["findManifestBySlug"]>) {
    return this.manifests.findManifestBySlug(...args);
  }

  createManifest(...args: Parameters<PrismaManifestRepository["createManifest"]>) {
    return this.manifests.createManifest(...args);
  }

  updateManifestDraft(...args: Parameters<PrismaManifestRepository["updateManifestDraft"]>) {
    return this.manifests.updateManifestDraft(...args);
  }

  archiveManifest(...args: Parameters<PrismaManifestRepository["archiveManifest"]>) {
    return this.manifests.archiveManifest(...args);
  }

  markManifestPublished(...args: Parameters<PrismaManifestRepository["markManifestPublished"]>) {
    return this.manifests.markManifestPublished(...args);
  }

  listManifestVersions(...args: Parameters<PrismaManifestRepository["listManifestVersions"]>) {
    return this.manifests.listManifestVersions(...args);
  }

  findManifestVersionById(...args: Parameters<PrismaManifestRepository["findManifestVersionById"]>) {
    return this.manifests.findManifestVersionById(...args);
  }

  createManifestVersion(...args: Parameters<PrismaManifestRepository["createManifestVersion"]>) {
    return this.manifests.createManifestVersion(...args);
  }

  findManifestVersionByManifestAndId(...args: Parameters<PrismaManifestRepository["findManifestVersionByManifestAndId"]>) {
    return this.manifests.findManifestVersionByManifestAndId(...args);
  }

  findManifestVersionByManifestAndVersion(...args: Parameters<PrismaManifestRepository["findManifestVersionByManifestAndVersion"]>) {
    return this.manifests.findManifestVersionByManifestAndVersion(...args);
  }

  publishManifestVersion(...args: Parameters<PrismaManifestRepository["publishManifestVersion"]>) {
    return this.manifests.publishManifestVersion(...args);
  }

  deprecateManifestVersion(...args: Parameters<PrismaManifestRepository["deprecateManifestVersion"]>) {
    return this.manifests.deprecateManifestVersion(...args);
  }

  updateManifestVersionChecksum(...args: Parameters<PrismaManifestRepository["updateManifestVersionChecksum"]>) {
    return this.manifests.updateManifestVersionChecksum(...args);
  }

  listManifestAssetBindings(...args: Parameters<PrismaManifestRepository["listManifestAssetBindings"]>) {
    return this.manifests.listManifestAssetBindings(...args);
  }

  createBinding(...args: Parameters<PrismaManifestRepository["createBinding"]>) {
    return this.manifests.createBinding(...args);
  }

  deleteBinding(...args: Parameters<PrismaManifestRepository["deleteBinding"]>) {
    return this.manifests.deleteBinding(...args);
  }

  reorderBindings(...args: Parameters<PrismaManifestRepository["reorderBindings"]>) {
    return this.manifests.reorderBindings(...args);
  }

  findBindingById(...args: Parameters<PrismaManifestRepository["findBindingById"]>) {
    return this.manifests.findBindingById(...args);
  }

  findBindingByAssetVersion(...args: Parameters<PrismaManifestRepository["findBindingByAssetVersion"]>) {
    return this.manifests.findBindingByAssetVersion(...args);
  }

  listBindingsForChecksum(...args: Parameters<PrismaManifestRepository["listBindingsForChecksum"]>) {
    return this.manifests.listBindingsForChecksum(...args);
  }

  listAgentProfiles(...args: Parameters<PrismaAgentProfileRepository["listAgentProfiles"]>) {
    return this.agentProfiles.listAgentProfiles(...args);
  }

  findAgentProfileById(...args: Parameters<PrismaAgentProfileRepository["findAgentProfileById"]>) {
    return this.agentProfiles.findAgentProfileById(...args);
  }

  findAgentProfileBySlugAndVersion(...args: Parameters<PrismaAgentProfileRepository["findAgentProfileBySlugAndVersion"]>) {
    return this.agentProfiles.findAgentProfileBySlugAndVersion(...args);
  }

  createAgentProfile(...args: Parameters<PrismaAgentProfileRepository["createAgentProfile"]>) {
    return this.agentProfiles.createAgentProfile(...args);
  }

  updateAgentProfileDraft(...args: Parameters<PrismaAgentProfileRepository["updateAgentProfileDraft"]>) {
    return this.agentProfiles.updateAgentProfileDraft(...args);
  }

  publishAgentProfile(...args: Parameters<PrismaAgentProfileRepository["publishAgentProfile"]>) {
    return this.agentProfiles.publishAgentProfile(...args);
  }

  deprecateAgentProfile(...args: Parameters<PrismaAgentProfileRepository["deprecateAgentProfile"]>) {
    return this.agentProfiles.deprecateAgentProfile(...args);
  }

  archiveAgentProfile(...args: Parameters<PrismaAgentProfileRepository["archiveAgentProfile"]>) {
    return this.agentProfiles.archiveAgentProfile(...args);
  }

  listInstallRecords(...args: Parameters<PrismaTelemetryRepository["listInstallRecords"]>) {
    return this.telemetry.listInstallRecords(...args);
  }

  listRuntimeFeedback(...args: Parameters<PrismaTelemetryRepository["listRuntimeFeedback"]>) {
    return this.telemetry.listRuntimeFeedback(...args);
  }

  async listAuditLogs(query: AuditLogListQuery = {}) {
    return this.auditLogs.listAuditLogs(query);
  }

  async createAuditLog(input: HubAuditLogCreateInput) {
    return this.auditLogs.createAuditLog(input);
  }

  get client() {
    return this.prisma;
  }
}
