import { MANIFEST_ERROR } from "./manifest-governance-errors";
import {
  assertSafeManifestPayload,
  normalizeScope,
  optionalString,
  parseStringArray,
  serializeManifest,
} from "./manifest-admin-shared";
import type { HubRepository } from "./repository";
import { getHubTransactionManager } from "./transactions/transaction-manager-provider";
import type { TransactionManagerPort } from "./transactions/transaction-manager-port";

type ManifestGovernanceServiceOptions = {
  transactionManager?: TransactionManagerPort;
};

type ManifestResponse = { manifest: ReturnType<typeof serializeManifest> };

function isHubRepository(value: unknown): value is HubRepository {
  return Boolean(value && typeof value === "object" && Array.isArray((value as HubRepository).manifests));
}

export class ManifestGovernanceService {
  private readonly repo?: HubRepository;
  private readonly transactionManager?: TransactionManagerPort;

  constructor(repoOrOptions?: HubRepository | ManifestGovernanceServiceOptions) {
    if (isHubRepository(repoOrOptions)) {
      this.repo = repoOrOptions;
    } else {
      this.transactionManager = repoOrOptions?.transactionManager ?? getHubTransactionManager();
    }
  }

  createDraft(input: Record<string, unknown>): ManifestResponse {
    assertSafeManifestPayload(input);
    const slug = String(input.slug ?? "").trim();
    const name = String(input.name ?? "").trim();
    if (!slug || !name || !input.scope) throw MANIFEST_ERROR.createInvalid();
    const createInput = {
      slug,
      name,
      scope: normalizeScope(input.scope),
      status: "draft" as const,
      description: String(input.description ?? ""),
      tags: parseStringArray(input.tags),
      techStacks: parseStringArray(input.techStacks),
      projectKinds: parseStringArray(input.projectKinds),
      recommendedFor: parseStringArray(input.recommendedFor),
      ownerOrgId: optionalString(input.ownerOrgId),
      ownerTeamId: optionalString(input.ownerTeamId),
      createdBy: "system",
      updatedBy: "system",
    };
    if (this.repo) {
      if (this.repo.manifests.some((item) => item.slug === slug)) throw MANIFEST_ERROR.slugExists();
      return { manifest: serializeManifest(this.repo.createManifest(createInput)) };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      if (await tx.manifests.findManifestBySlug(slug)) throw MANIFEST_ERROR.slugExists();
      const manifest = await tx.manifests.createManifest(createInput);
      return { manifest: serializeManifest(manifest) };
    }) as unknown as ManifestResponse;
  }

  updateDraft(manifestId: string, input: Record<string, unknown>): ManifestResponse {
    assertSafeManifestPayload(input);
    if ("slug" in input) throw MANIFEST_ERROR.updateNotAllowed();
    if (this.repo) {
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
      if (manifest.status === "rejected") manifest.status = "draft";
      manifest.updatedBy = "system";
      manifest.updatedAt = new Date().toISOString();
      return { manifest: serializeManifest(manifest) };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      if (manifest.status === "archived") throw MANIFEST_ERROR.archived();
      if (manifest.status !== "draft" && manifest.status !== "rejected") throw MANIFEST_ERROR.updateNotAllowed();
      const updated = await tx.manifests.updateManifestDraft({
        manifestId,
        ...(input.name !== undefined ? { name: String(input.name).trim() } : {}),
        ...(input.description !== undefined ? { description: String(input.description ?? "") } : {}),
        ...(input.tags !== undefined ? { tags: parseStringArray(input.tags) } : {}),
        ...(input.techStacks !== undefined ? { techStacks: parseStringArray(input.techStacks) } : {}),
        ...(input.projectKinds !== undefined ? { projectKinds: parseStringArray(input.projectKinds) } : {}),
        ...(input.recommendedFor !== undefined ? { recommendedFor: parseStringArray(input.recommendedFor) } : {}),
        ...(input.ownerTeamId !== undefined ? { ownerTeamId: optionalString(input.ownerTeamId) } : {}),
        updatedBy: "system",
      });
      return { manifest: serializeManifest(updated) };
    }) as unknown as ManifestResponse;
  }

  archive(manifestId: string, input: Record<string, unknown>): ManifestResponse {
    assertSafeManifestPayload(input);
    const reason = String(input.reason ?? "").trim();
    if (!reason) throw MANIFEST_ERROR.createInvalid("归档原因不能为空");
    if (this.repo) {
      const manifest = this.repo.manifests.find((item) => item.id === manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      manifest.status = "archived";
      manifest.archivedAt = new Date().toISOString();
      manifest.updatedBy = "system";
      manifest.updatedAt = new Date().toISOString();
      return { manifest: serializeManifest(manifest) };
    }
    return this.transactionManager!.runInTransaction(async (tx) => {
      const manifest = await tx.manifests.findManifestById(manifestId);
      if (!manifest) throw MANIFEST_ERROR.notFound();
      const archived = await tx.manifests.archiveManifest({
        manifestId,
        archivedAt: new Date().toISOString(),
        updatedBy: "system",
      });
      return { manifest: serializeManifest(archived) };
    }) as unknown as ManifestResponse;
  }
}
