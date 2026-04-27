import type {
  CreateManifestVersionInput,
  DeprecateManifestVersionInput,
  HubManifestVersionDetail,
  PublishManifestVersionInput,
  RejectManifestVersionReviewInput,
  SubmitManifestVersionReviewInput,
  UpdateManifestVersionChecksumInput,
} from "../repository-types";

export interface ManifestVersionRepositoryPort {
  createManifestVersion(input: CreateManifestVersionInput): Promise<HubManifestVersionDetail>;
  findManifestVersionByManifestAndId(manifestId: string, versionId: string): Promise<HubManifestVersionDetail | null>;
  findManifestVersionByManifestAndVersion(manifestId: string, version: string): Promise<HubManifestVersionDetail | null>;
  submitManifestVersionReview(input: SubmitManifestVersionReviewInput): Promise<HubManifestVersionDetail>;
  rejectManifestVersionReview(input: RejectManifestVersionReviewInput): Promise<HubManifestVersionDetail>;
  publishManifestVersion(input: PublishManifestVersionInput): Promise<HubManifestVersionDetail>;
  deprecateManifestVersion(input: DeprecateManifestVersionInput): Promise<HubManifestVersionDetail>;
  updateManifestVersionChecksum(input: UpdateManifestVersionChecksumInput): Promise<HubManifestVersionDetail>;
}
