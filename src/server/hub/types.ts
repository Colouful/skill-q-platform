export const HUB_ASSET_KINDS = [
  "rule",
  "skill",
  "role",
  "flow",
  "scenario",
  "manifest",
  "agent-profile",
  "tech-profile",
  "source-pack",
  "contract",
] as const;

export const HUB_SCOPES = ["platform", "department", "team", "project", "personal"] as const;

export const HUB_STATUSES = ["draft", "reviewing", "published", "deprecated", "archived", "rejected"] as const;

export type HubAssetKind = (typeof HUB_ASSET_KINDS)[number];
export type HubScope = (typeof HUB_SCOPES)[number];
export type HubStatus = (typeof HUB_STATUSES)[number];

export type HubAsset = {
  id: string;
  slug: string;
  name: string;
  kind: HubAssetKind;
  scope: HubScope;
  ownerOrgId: string | null;
  ownerTeamId: string | null;
  ownerUserId: string | null;
  status: HubStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type HubAssetVersion = {
  id: string;
  assetId: string;
  version: string;
  content: string;
  contentFormat: "markdown";
  checksum: string;
  status: HubStatus;
  immutable: boolean;
  qualityScore: number;
  dependencies: unknown[];
  compatibility: Record<string, unknown>;
  createdAt: string;
  publishedAt: string | null;
};

export type HubManifest = {
  id: string;
  slug: string;
  name: string;
  scope: HubScope;
  ownerOrgId: string | null;
  ownerTeamId: string | null;
  status: HubStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type HubManifestVersion = {
  id: string;
  manifestId: string;
  version: string;
  status: HubStatus;
  checksum: string;
  installPolicy: {
    defaultExecutor: "cursor" | "codex" | "claude-code";
    fallbackExecutors: Array<"claude-code" | "codex" | "cursor">;
  };
  compatibility: Record<string, unknown>;
  createdAt: string;
  publishedAt: string | null;
};

export type HubManifestAsset = {
  id: string;
  manifestVersionId: string;
  assetId: string;
  assetVersionId: string;
  kind: HubAssetKind;
  required: boolean;
  loadWhen: string[];
  order: number;
};

export type HubAgentProfileContent = {
  slug: string;
  name: string;
  defaultExecutor: "cursor" | "codex" | "claude-code";
  fallbackExecutors: Array<"claude-code" | "codex" | "cursor">;
  allowedTools: string[];
  deniedTools: string[];
  contextScope: {
    allowSourceCode: boolean;
    allowRelativePath: boolean;
    allowAbsolutePath: boolean;
  };
  modelPolicy: {
    tokenBudget: number;
    reasoningEffort: "low" | "medium" | "high" | "xhigh";
  };
  approvalPolicy: {
    beforePush: boolean;
    beforeMerge: boolean;
    highRiskAlwaysManual: boolean;
  };
  outputContract: {
    mustReturn: string[];
  };
  riskLevel: "low" | "medium" | "high";
};

export type HubAgentProfile = {
  id: string;
  slug: string;
  name: string;
  scope: HubScope;
  status: HubStatus;
  version: string;
  content: HubAgentProfileContent;
  checksum: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type HubInstallRecord = {
  id: string;
  projectId: string;
  workspaceId: string | null;
  manifest: { slug: string; version: string };
  packages: unknown[];
  installedAt: string;
  client: { name: string; version: string };
  createdAt: string;
};

export type HubRuntimeFeedback = {
  id: string;
  projectId: string;
  runId: string;
  manifest: { slug: string; version: string };
  assetsUsed: unknown[];
  executor: string;
  result: { status: string; success: boolean; durationMs: number };
  issues: unknown[];
  createdAt: string;
};
