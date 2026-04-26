import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

describe("Manifest write repository contract", () => {
  it("应支持 Manifest 创建、更新、发布标记和归档", async () => {
    const repository = new InMemoryHubRepositoryAdapter(createHubRepository());

    const manifest = await repository.createManifest({
      slug: "manifest-write-contract",
      name: "Manifest 写契约",
      scope: "platform",
      tags: ["contract"],
      techStacks: ["react"],
      projectKinds: ["frontend"],
    });
    expect(manifest).toMatchObject({ slug: "manifest-write-contract", status: "draft" });

    const updated = await repository.updateManifestDraft({
      manifestId: manifest.id,
      name: "Manifest 写契约更新",
      ownerTeamId: "team-1",
      updatedBy: "tester",
    });
    expect(updated).toMatchObject({ name: "Manifest 写契约更新", status: "draft", updatedBy: "tester" });

    const published = await repository.markManifestPublished({
      manifestId: manifest.id,
      latestVersionId: "manifest-version-1",
      updatedBy: "system",
    });
    expect(published).toMatchObject({ status: "published", latestVersionId: "manifest-version-1" });

    const archived = await repository.archiveManifest({ manifestId: manifest.id, updatedBy: "system" });
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).toEqual(expect.any(String));
  });
});
