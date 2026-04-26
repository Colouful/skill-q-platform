import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  assertSafeManifestPayload,
  normalizeScope,
  optionalString,
  parseStringArray,
  serializeManifest,
} from "./manifest-admin-shared";
import type { HubRepository } from "./repository";

export class ManifestGovernanceService {
  constructor(private readonly repo: HubRepository) {}

  createDraft(input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    const slug = String(input.slug ?? "").trim();
    const name = String(input.name ?? "").trim();
    if (!slug || !name || !input.scope) throw MANIFEST_ERROR.createInvalid();
    if (this.repo.manifests.some((item) => item.slug === slug)) throw MANIFEST_ERROR.slugExists();
    const manifest = this.repo.createManifest({
      slug,
      name,
      scope: normalizeScope(input.scope),
      status: "draft",
      description: String(input.description ?? ""),
      tags: parseStringArray(input.tags),
      techStacks: parseStringArray(input.techStacks),
      projectKinds: parseStringArray(input.projectKinds),
      recommendedFor: parseStringArray(input.recommendedFor),
      ownerOrgId: optionalString(input.ownerOrgId),
      ownerTeamId: optionalString(input.ownerTeamId),
      createdBy: "system",
      updatedBy: "system",
    });
    return { manifest: serializeManifest(manifest) };
  }

  updateDraft(manifestId: string, input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    if ("slug" in input) throw MANIFEST_ERROR.updateNotAllowed();
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
    if (manifest.status !== "draft" && manifest.status !== "rejected") throw MANIFEST_ERROR.updateNotAllowed();

    if (input.name !== undefined) manifest.name = String(input.name).trim();
    if (input.description !== undefined) manifest.description = String(input.description ?? "");
    if (input.tags !== undefined) manifest.tags = parseStringArray(input.tags);
    if (input.techStacks !== undefined) manifest.techStacks = parseStringArray(input.techStacks);
    if (input.projectKinds !== undefined) manifest.projectKinds = parseStringArray(input.projectKinds);
    if (input.recommendedFor !== undefined) manifest.recommendedFor = parseStringArray(input.recommendedFor);
    if (input.ownerTeamId !== undefined) manifest.ownerTeamId = optionalString(input.ownerTeamId);
    manifest.updatedBy = "system";
    manifest.updatedAt = new Date().toISOString();
    return { manifest: serializeManifest(manifest) };
  }

  archive(manifestId: string, input: Record<string, unknown>) {
    assertSafeManifestPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw MANIFEST_ERROR.createInvalid("归档原因不能为空");
    const manifest = this.repo.manifests.find((item) => item.id === manifestId);
    if (!manifest) throw MANIFEST_ERROR.notFound();
    manifest.status = "archived";
    manifest.archivedAt = new Date().toISOString();
    manifest.updatedBy = "system";
    manifest.updatedAt = new Date().toISOString();
    return { manifest: serializeManifest(manifest) };
  }
}
