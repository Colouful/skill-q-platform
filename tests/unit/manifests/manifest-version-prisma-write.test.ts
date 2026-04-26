import { describe, expect, it } from "vitest";
import { ManifestGovernanceService } from "@/server/hub/manifest-governance-service";
import { ManifestVersionService } from "@/server/hub/manifest-version-service";
import { createHubRepository } from "@/server/hub/repository";
import { MemoryTransactionManager } from "@/server/hub/transactions/memory-transaction-manager";

describe("ManifestVersionService 写事务", () => {
  it("应创建 Manifest Version 并使用默认 installPolicy", async () => {
    const manager = new MemoryTransactionManager(createHubRepository());
    const manifest = await new ManifestGovernanceService({ transactionManager: manager }).createDraft({
      slug: "manifest-version-prisma-write",
      name: "Manifest 版本写事务",
      scope: "platform",
    });

    const version = await new ManifestVersionService({ transactionManager: manager }).create(manifest.manifest.id, {
      version: "1.0.0",
    });

    expect(version.version.installPolicy).toEqual({
      defaultExecutor: "cursor",
      fallbackExecutors: ["claude-code", "codex"],
    });
    expect(version.version.checksum).toMatch(/^sha256:/);
  });

  it("version 重复时应报错", async () => {
    const manager = new MemoryTransactionManager(createHubRepository());
    const manifest = await new ManifestGovernanceService({ transactionManager: manager }).createDraft({
      slug: "manifest-version-duplicate",
      name: "Manifest 版本重复",
      scope: "platform",
    });
    await new ManifestVersionService({ transactionManager: manager }).create(manifest.manifest.id, { version: "1.0.0" });

    await expect(new ManifestVersionService({ transactionManager: manager }).create(manifest.manifest.id, { version: "1.0.0" })).rejects.toMatchObject({
      code: "MANIFEST_VERSION_ALREADY_EXISTS",
    });
  });
});
