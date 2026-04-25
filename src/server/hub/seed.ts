import { AssetService } from "./asset-service";
import { safeJsonHash, stableStringify } from "./checksum";
import { HubRepository, createHubRepository } from "./repository";
import type { HubAgentProfileContent } from "./types";

export const DEFAULT_AGENT_PROFILE: HubAgentProfileContent = {
  slug: "diagnostic-agent",
  name: "Diagnostic Agent",
  defaultExecutor: "cursor",
  fallbackExecutors: ["claude-code", "codex"],
  allowedTools: ["read", "write", "test"],
  deniedTools: ["upload-source", "deploy", "push", "merge"],
  contextScope: {
    allowSourceCode: false,
    allowRelativePath: true,
    allowAbsolutePath: false,
  },
  modelPolicy: {
    tokenBudget: 80000,
    reasoningEffort: "high",
  },
  approvalPolicy: {
    beforePush: true,
    beforeMerge: true,
    highRiskAlwaysManual: true,
  },
  outputContract: {
    mustReturn: ["summary", "changedFiles", "risks", "verification"],
  },
  riskLevel: "medium",
};

const MANIFESTS = [
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

function addPublishedAsset(repo: HubRepository, input: { slug: string; name: string; kind: "role" | "flow" | "agent-profile"; content: string }) {
  const assetService = new AssetService(repo);
  const asset = assetService.createDraftAsset({
    slug: input.slug,
    name: input.name,
    kind: input.kind,
    description: input.name,
  });
  const version = assetService.createVersion({
    assetSlug: asset.slug,
    version: "1.0.0",
    content: input.content,
    status: "published",
  });
  return { asset, version };
}

export function createSeededHubRepository() {
  const repo = createHubRepository();
  const plannerRole = addPublishedAsset(repo, {
    slug: "planner-role",
    name: "Planner Role",
    kind: "role",
    content: "# Planner Role\n\n用于规划阶段的基础角色资产。\n",
  });
  const implementationFlow = addPublishedAsset(repo, {
    slug: "implementation-flow",
    name: "Implementation Flow",
    kind: "flow",
    content: "# Implementation Flow\n\n用于实现阶段的基础流程资产。\n",
  });
  const diagnosticProfile = repo.createAgentProfile({
    slug: DEFAULT_AGENT_PROFILE.slug,
    name: DEFAULT_AGENT_PROFILE.name,
    content: DEFAULT_AGENT_PROFILE,
    version: "1.0.0",
    status: "published",
  });
  const diagnosticAsset = addPublishedAsset(repo, {
    slug: "diagnostic-agent",
    name: "Diagnostic Agent",
    kind: "agent-profile",
    content: stableStringify(DEFAULT_AGENT_PROFILE),
  });

  for (const slug of MANIFESTS) {
    const manifest = repo.createManifest({
      slug,
      name: slug,
      status: "published",
      description: `${slug} 标准 Manifest`,
    });
    const manifestVersion = repo.createManifestVersion({
      manifestId: manifest.id,
      version: "1.0.0",
      status: "published",
      installPolicy: {
        defaultExecutor: "cursor",
        fallbackExecutors: ["claude-code", "codex"],
      },
      compatibility: {
        manifestSlug: slug,
      },
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: plannerRole.asset.id,
      assetVersionId: plannerRole.version.id,
      kind: "role",
      required: true,
      loadWhen: ["planning"],
      order: 10,
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: implementationFlow.asset.id,
      assetVersionId: implementationFlow.version.id,
      kind: "flow",
      required: true,
      loadWhen: ["implementation"],
      order: 20,
    });
    repo.linkManifestAsset({
      manifestVersionId: manifestVersion.id,
      assetId: diagnosticAsset.asset.id,
      assetVersionId: diagnosticAsset.version.id,
      kind: "agent-profile",
      required: true,
      loadWhen: ["diagnosing"],
      order: 30,
    });
    manifestVersion.checksum = safeJsonHash({
      slug,
      version: manifestVersion.version,
      assets: [plannerRole.version.checksum, implementationFlow.version.checksum, diagnosticAsset.version.checksum],
      installPolicy: manifestVersion.installPolicy,
    });
  }

  return repo;
}

export const defaultHubRepository = createSeededHubRepository();
