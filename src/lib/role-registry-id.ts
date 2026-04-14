import { normalizeRegistryLikeId } from "@/lib/hub-registry-contract";

type RoleProtocolLike = {
  slug: string;
  registryId?: string | null;
  manifestId?: string | null;
};

export function toRoleProtocolId(role: RoleProtocolLike): string {
  const explicitManifestId = normalizeRegistryLikeId(role.manifestId);
  if (explicitManifestId) return explicitManifestId;
  const explicitRegistryId = normalizeRegistryLikeId(role.registryId);
  if (explicitRegistryId) return explicitRegistryId;
  return role.slug.trim();
}
