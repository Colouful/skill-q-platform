import type {
  CreateAssetVersionInput,
  DeprecateAssetVersionInput,
  HubAssetVersionDetail,
  PublishAssetVersionInput,
  RejectAssetVersionReviewInput,
  SubmitAssetVersionReviewInput,
} from "../repository-types";

export interface AssetVersionRepositoryPort {
  createAssetVersion(input: CreateAssetVersionInput): Promise<HubAssetVersionDetail>;
  findAssetVersionByAssetAndId(assetId: string, versionId: string): Promise<HubAssetVersionDetail | null>;
  findAssetVersionByAssetAndVersion(assetId: string, version: string): Promise<HubAssetVersionDetail | null>;
  submitAssetVersionReview(input: SubmitAssetVersionReviewInput): Promise<HubAssetVersionDetail>;
  rejectAssetVersionReview(input: RejectAssetVersionReviewInput): Promise<HubAssetVersionDetail>;
  publishAssetVersion(input: PublishAssetVersionInput): Promise<HubAssetVersionDetail>;
  deprecateAssetVersion(input: DeprecateAssetVersionInput): Promise<HubAssetVersionDetail>;
}
