import { safeJsonHash } from "./checksum";
import { HubError } from "./errors";
import type { HubRepository } from "./repository";

function getHubUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
}

export class ManifestExportService {
  constructor(private readonly repo: HubRepository) {}

  export(input: { slug: string; version?: string; teamId?: string }) {
    const manifest = this.repo.manifests.find((item) => item.slug === input.slug);
    if (!manifest) {
      throw new HubError("MANIFEST_NOT_FOUND", "Manifest 不存在", "请确认 Manifest slug 是否正确。", 404);
    }
    if (manifest.status !== "published") {
      throw new HubError("MANIFEST_NOT_PUBLISHED", "Manifest 尚未发布", "请先发布 Manifest 后再导出。", 409);
    }
    const versions = this.repo.manifestVersions
      .filter((item) => item.manifestId === manifest.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const manifestVersion = input.version ? versions.find((item) => item.version === input.version) : versions[0];
    if (!manifestVersion) {
      throw new HubError("MANIFEST_VERSION_NOT_FOUND", "Manifest 版本不存在", "请确认 version 是否正确。", 404);
    }
    if (manifestVersion.status !== "published") {
      throw new HubError("MANIFEST_NOT_PUBLISHED", "Manifest 版本尚未发布", "请先发布该版本。", 409);
    }
    if (!manifestVersion.checksum) {
      throw new HubError("CHECKSUM_REQUIRED", "Manifest checksum 不能为空", "请重新生成 Manifest checksum。", 400);
    }

    const links = this.repo.manifestAssets
      .filter((item) => item.manifestVersionId === manifestVersion.id)
      .sort((a, b) => a.order - b.order);
    const assets = [];
    const agentProfiles = [];
    for (const link of links) {
      const asset = this.repo.assets.find((item) => item.id === link.assetId);
      const assetVersion = this.repo.assetVersions.find((item) => item.id === link.assetVersionId);
      if (!asset || !assetVersion) {
        throw new HubError("MANIFEST_ASSET_MISSING", "Manifest 引用了不存在的资产", "请检查 Manifest 资产关联。", 409);
      }
      if (asset.status !== "published" || assetVersion.status !== "published") {
        throw new HubError(
          "MANIFEST_ASSET_NOT_PUBLISHED",
          "Manifest 引用了未发布资产",
          "请先发布资产版本，或移除该关联。",
          409,
        );
      }
      if (!assetVersion.checksum) {
        throw new HubError("CHECKSUM_REQUIRED", "资产 checksum 不能为空", "请重新生成资产 checksum。", 400);
      }
      const contentUrl = `/api/hub/assets/${encodeURIComponent(asset.slug)}/content?version=${encodeURIComponent(assetVersion.version)}`;
      const entry = {
        kind: asset.kind,
        slug: asset.slug,
        name: asset.name,
        version: assetVersion.version,
        checksum: assetVersion.checksum,
        required: link.required,
        loadWhen: link.loadWhen,
        contentUrl,
      };
      if (asset.kind === "agent-profile") {
        agentProfiles.push({
          slug: asset.slug,
          version: assetVersion.version,
          checksum: assetVersion.checksum,
          contentUrl: `/api/hub/agent-profiles/${encodeURIComponent(asset.slug)}/export?version=${encodeURIComponent(assetVersion.version)}`,
        });
      } else {
        assets.push(entry);
      }
    }

    const payload = {
      schemaVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      hub: {
        url: getHubUrl(),
        name: "skill-q-platform",
      },
      manifest: {
        slug: manifest.slug,
        version: manifestVersion.version,
        checksum: manifestVersion.checksum || safeJsonHash({ manifest, manifestVersion }),
        installPolicy: manifestVersion.installPolicy,
      },
      assets,
      agentProfiles,
    };
    if (!payload.manifest.installPolicy.defaultExecutor) {
      throw new HubError("INSTALL_POLICY_INVALID", "Manifest installPolicy 缺少 defaultExecutor", "请补充默认执行器。", 400);
    }
    return payload;
  }
}
