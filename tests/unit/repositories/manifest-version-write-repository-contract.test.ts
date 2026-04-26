import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";

describe("ManifestVersion write repository contract", () => {
  it("应支持 ManifestVersion 创建、发布、checksum 更新和废弃", async () => {
    const repository = new InMemoryHubRepositoryAdapter(createHubRepository());
    const manifest = await repository.createManifest({
      slug: "manifest-version-write-contract",
      name: "Manifest 版本写契约",
      scope: "platform",
    });

    const version = await repository.createManifestVersion({
      manifestId: manifest.id,
      version: "1.0.0",
      checksum: "sha256:initial",
    });
    expect(version).toMatchObject({ manifestId: manifest.id, version: "1.0.0", status: "draft" });

    await expect(repository.findManifestVersionByManifestAndVersion(manifest.id, "1.0.0")).resolves.toMatchObject({
      id: version.id,
    });

    const checked = await repository.updateManifestVersionChecksum({
      manifestId: manifest.id,
      versionId: version.id,
      checksum: "sha256:updated",
    });
    expect(checked.checksum).toBe("sha256:updated");

    const published = await repository.publishManifestVersion({
      manifestId: manifest.id,
      versionId: version.id,
      checksum: "sha256:published",
      publishedBy: "system",
    });
    expect(published).toMatchObject({ status: "published", checksum: "sha256:published" });

    const deprecated = await repository.deprecateManifestVersion({ manifestId: manifest.id, versionId: version.id });
    expect(deprecated).toMatchObject({ status: "deprecated", checksum: "sha256:published" });
  });
});
