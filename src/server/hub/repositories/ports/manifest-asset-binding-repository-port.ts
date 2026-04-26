import type { CreateManifestAssetBindingInput, HubManifestAssetBinding } from "../repository-types";

export interface ManifestAssetBindingRepositoryPort {
  createBinding(input: CreateManifestAssetBindingInput): Promise<HubManifestAssetBinding>;
  deleteBinding(manifestVersionId: string, bindingId: string): Promise<void>;
  reorderBindings(manifestVersionId: string, items: Array<{ bindingId: string; order: number }>): Promise<HubManifestAssetBinding[]>;
  findBindingById(manifestVersionId: string, bindingId: string): Promise<HubManifestAssetBinding | null>;
  findBindingByAssetVersion(manifestVersionId: string, assetVersionId: string): Promise<HubManifestAssetBinding | null>;
  listBindingsForChecksum(manifestVersionId: string): Promise<HubManifestAssetBinding[]>;
}
