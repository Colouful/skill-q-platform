export type HubManifestExportManifestRow = {
  manifestId: string;
  name: string;
  displayName: string;
  description: string | null;
  status: string;
  techStacks: unknown;
  ides: unknown;
  scenarios: unknown;
};

export type HubManifestExportVersionRow = {
  version: string;
  checksum: string;
  installPolicy: unknown;
  compatibility: unknown;
  exportSnapshot: unknown;
  status: string;
};

export type HubManifestExportAssetRow = {
  kind: string;
  assetId: string;
  version: string;
  required: boolean | number;
  installPath: string | null;
  checksum: string;
  sortOrder: number;
  config: unknown;
};

export type HubManifestExportAssetVersionRow = {
  assetId: string;
  version: string;
  content: string | null;
  contentFormat: string;
  checksum: string;
  contentUrl: string | null;
  riskLevel: string | null;
  status: string;
};

export type HubManifestExportPayload = {
  contractVersion: "1.0.0";
  manifest: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    status: string;
    techStacks: string[];
    ides: string[];
    scenarios: string[];
    compatibility: Record<string, unknown>;
  };
  version: string;
  checksum: string;
  installPolicy: Record<string, unknown>;
  assets: Array<Record<string, unknown>>;
  files: Array<Record<string, unknown>>;
};

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringArray(value: unknown): string[] {
  const parsed = parseJsonValue<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function objectValue(value: unknown): Record<string, unknown> {
  const parsed = parseJsonValue<unknown>(value, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function snapshotValue(value: unknown): HubManifestExportPayload | null {
  const parsed = parseJsonValue<unknown>(value, null);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const candidate = parsed as Partial<HubManifestExportPayload>;
  if (candidate.contractVersion !== "1.0.0") return null;
  if (!candidate.manifest || !candidate.version || !Array.isArray(candidate.assets)) return null;
  return {
    ...candidate,
    files: Array.isArray(candidate.files) ? candidate.files : [],
  } as HubManifestExportPayload;
}

export function buildHubManifestExportPayload(input: {
  manifest: HubManifestExportManifestRow;
  version: HubManifestExportVersionRow;
  assets: HubManifestExportAssetRow[];
  assetVersions: HubManifestExportAssetVersionRow[];
}): HubManifestExportPayload {
  const snapshot = snapshotValue(input.version.exportSnapshot);
  if (snapshot) return snapshot;

  const assetVersionByKey = new Map<string, HubManifestExportAssetVersionRow>();
  for (const item of input.assetVersions) {
    assetVersionByKey.set(`${item.assetId}@${item.version}`, item);
  }

  const assets = input.assets.map((asset) => {
    const version = assetVersionByKey.get(`${asset.assetId}@${asset.version}`);
    const installPath = asset.installPath ?? `.agents/registry/${asset.kind}/${asset.assetId}.md`;
    return {
      kind: asset.kind,
      assetId: asset.assetId,
      slug: asset.assetId,
      version: asset.version,
      required: Boolean(asset.required),
      installPath,
      checksum: asset.checksum || version?.checksum || "",
      riskLevel: version?.riskLevel ?? "L0",
      content: version?.content ?? undefined,
      contentFormat: version?.contentFormat ?? "markdown",
      contentUrl: version?.contentUrl ?? undefined,
      config: objectValue(asset.config),
    };
  });

  return {
    contractVersion: "1.0.0",
    manifest: {
      id: input.manifest.manifestId,
      name: input.manifest.name,
      displayName: input.manifest.displayName,
      description: input.manifest.description ?? "",
      version: input.version.version,
      status: input.manifest.status,
      techStacks: stringArray(input.manifest.techStacks),
      ides: stringArray(input.manifest.ides),
      scenarios: stringArray(input.manifest.scenarios),
      compatibility: objectValue(input.version.compatibility),
    },
    version: input.version.version,
    checksum: input.version.checksum,
    installPolicy: objectValue(input.version.installPolicy),
    assets,
    files: assets.map((asset) => ({
      assetId: asset.assetId,
      path: asset.installPath,
      content: asset.content,
      contentFormat: asset.contentFormat,
      checksum: asset.checksum,
    })),
  };
}
