import { describe, expect, it } from "vitest";
import { createSeededHubRepository } from "@/server/hub/seed";

const V1_1_MANIFESTS = [
  "frontend-react-nextjs-standard",
  "frontend-react-vite-standard",
  "frontend-react-standard",
  "frontend-vue-vite-standard",
  "backend-java-springboot-standard",
  "backend-java-springmvc-legacy-standard",
  "backend-java-springcloud-standard",
  "backend-python-fastapi-standard",
  "backend-go-standard",
  "backend-node-nestjs-standard",
];

describe("Hub seed 契约", () => {
  it("seed 数据应包含 V1.1 标准 Manifest", () => {
    const repo = createSeededHubRepository();
    const manifestSlugs = repo.manifests.map((item) => item.slug);

    expect(manifestSlugs).toEqual(expect.arrayContaining(V1_1_MANIFESTS));
    for (const slug of V1_1_MANIFESTS) {
      const manifest = repo.manifests.find((item) => item.slug === slug);
      const version = repo.manifestVersions.find((item) => item.manifestId === manifest?.id);

      expect(manifest?.status).toBe("published");
      expect(version?.version).toBe("1.0.0");
      expect(version?.status).toBe("published");
      expect(version?.checksum).toMatch(/^sha256:/);
    }
  });

  it("seed 数据应包含 diagnostic-agent", () => {
    const repo = createSeededHubRepository();
    const profile = repo.agentProfiles.find((item) => item.slug === "diagnostic-agent");
    const profileAsset = repo.assets.find((item) => item.slug === "diagnostic-agent" && item.kind === "agent-profile");
    const profileVersion = repo.assetVersions.find((item) => item.assetId === profileAsset?.id);

    expect(profile).toEqual(
      expect.objectContaining({
        slug: "diagnostic-agent",
        version: "1.0.0",
        status: "published",
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(profile?.content.deniedTools).toEqual(expect.arrayContaining(["upload-source", "push", "merge"]));
    expect(profileAsset?.status).toBe("published");
    expect(profileVersion?.checksum).toMatch(/^sha256:/);
  });

  it("seed Manifest 应绑定 published asset version", () => {
    const repo = createSeededHubRepository();

    for (const link of repo.manifestAssets) {
      const asset = repo.assets.find((item) => item.id === link.assetId);
      const version = repo.assetVersions.find((item) => item.id === link.assetVersionId);

      expect(asset?.status).toBe("published");
      expect(version?.status).toBe("published");
      expect(version?.immutable).toBe(true);
      expect(version?.checksum).toMatch(/^sha256:/);
    }
  });

  it("seed 数据应包含 V2.1 发布流测试用 draft asset version", () => {
    const repo = createSeededHubRepository();
    const draftVersion = repo.assetVersions.find((item) => item.status === "draft");

    expect(draftVersion).toEqual(
      expect.objectContaining({
        version: "1.1.0-draft",
        status: "draft",
        immutable: false,
        checksum: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(repo.manifestAssets.some((item) => item.assetVersionId === draftVersion?.id)).toBe(false);
  });
});
