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
  tags?: unknown[];
  visibility?: string | null;
  latestVersionId?: string | null;
  deprecatedAt?: string | null;
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HubAssetVersion = {
  id: string;
  assetId: string;
  version: string;
  content: string;
  contentFormat: "markdown" | "json" | "yaml";
  checksum: string;
  status: HubStatus;
  immutable: boolean;
  qualityScore: number;
  dependencies: unknown[];
  compatibility: Record<string, unknown>;
  changelog?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
  source?: string | null;
  contentSize?: number | null;
  previousVersionId?: string | null;
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
  tags?: unknown[];
  techStacks?: unknown[];
  projectKinds?: unknown[];
  recommendedFor?: unknown[];
  latestVersionId?: string | null;
  deprecatedAt?: string | null;
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
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
  changelog?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
  previousVersionId?: string | null;
  exportSchemaVersion?: string | null;
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
  alias?: string | null;
  reason?: string | null;
  stage?: string | null;
  addedBy?: string | null;
  addedAt?: string | null;
  policy?: Record<string, unknown> | null;
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
    reasoningEffort: "low" | "medium" | "high" | "ultra" | "xhigh";
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
  description?: string;
  scope: HubScope;
  status: HubStatus;
  version: string;
  content: HubAgentProfileContent;
  checksum: string;
  ownerOrgId?: string | null;
  ownerTeamId?: string | null;
  ownerUserId?: string | null;
  riskLevel?: string | null;
  createdBy?: string | null;
  publishedBy?: string | null;
  deprecatedAt?: string | null;
  archivedAt?: string | null;
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
  manifestSlug?: string | null;
  manifestVersion?: string | null;
  manifestChecksum?: string | null;
  status?: string | null;
  failureReason?: string | null;
  packageCount?: number | null;
  clientName?: string | null;
  clientVersion?: string | null;
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
  manifestSlug?: string | null;
  manifestVersion?: string | null;
  success?: boolean | null;
  durationMs?: number | null;
  failureCategory?: string | null;
  executorType?: string | null;
  assetSlugs?: unknown[] | null;
  privacyChecked?: boolean | null;
  createdAt: string;
};
