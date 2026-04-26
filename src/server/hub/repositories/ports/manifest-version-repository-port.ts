import type {
  CreateManifestVersionInput,
  DeprecateManifestVersionInput,
  HubManifestVersionDetail,
  PublishManifestVersionInput,
  UpdateManifestVersionChecksumInput,
} from "../repository-types";

export interface ManifestVersionRepositoryPort {
  createManifestVersion(input: CreateManifestVersionInput): Promise<HubManifestVersionDetail>;
  findManifestVersionByManifestAndId(manifestId: string, versionId: string): Promise<HubManifestVersionDetail | null>;
  findManifestVersionByManifestAndVersion(manifestId: string, version: string): Promise<HubManifestVersionDetail | null>;
  publishManifestVersion(input: PublishManifestVersionInput): Promise<HubManifestVersionDetail>;
  deprecateManifestVersion(input: DeprecateManifestVersionInput): Promise<HubManifestVersionDetail>;
  updateManifestVersionChecksum(input: UpdateManifestVersionChecksumInput): Promise<HubManifestVersionDetail>;
}
