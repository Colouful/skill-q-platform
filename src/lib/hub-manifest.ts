import { createHash } from "node:crypto";
import { z } from "zod";
import { HubApiError } from "@/lib/hub-response";

export const assetKindSchema = z.enum([
  "skill",
  "rule",
  "role",
  "flow",
  "scenario",
  "template",
  "checklist",
  "adapter",
  "quality_gate",
  "profile",
]);

export const manifestStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "published",
  "deprecated",
  "archived",
]);

export const riskLevelSchema = z.enum(["L0", "L1", "L2", "L3", "L4"]);
const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, "版本必须使用 MAJOR.MINOR.PATCH");

export const manifestAssetSchema = z.object({
  kind: assetKindSchema,
  assetId: z.string().min(1),
  version: semverSchema,
  required: z.boolean().default(true),
  installPath: z.string().optional(),
  checksum: z.string().min(1),
  order: z.number().int().optional(),
  riskLevel: riskLevelSchema.default("L0"),
  contentUrl: z.string().url().optional(),
  content: z.string().optional(),
  contentFormat: z.string().optional(),
});

export const manifestInstallPolicySchema = z
  .object({
    mode: z.enum(["light", "standard", "strict", "audit-only"]).default("standard"),
    allowOptionalFailure: z.boolean().default(true),
    conflictStrategy: z.enum(["skip", "backup", "manual"]).default("backup"),
  })
  .default({ mode: "standard", allowOptionalFailure: true, conflictStrategy: "backup" });

export const manifestCompatibilitySchema = z
  .object({
    minCliVersion: semverSchema.default("0.1.11"),
    maxCliVersion: semverSchema.optional(),
  })
  .default({ minCliVersion: "0.1.11" });

export const manifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().default(""),
  version: semverSchema,
  status: manifestStatusSchema.default("draft"),
  techStacks: z.array(z.string()).default([]),
  ides: z.array(z.string()).default([]),
  scenarios: z.array(z.string()).default([]),
  installPolicy: manifestInstallPolicySchema,
  compatibility: manifestCompatibilitySchema,
  assets: z.array(manifestAssetSchema).min(1, "Manifest 至少需要一个资产"),
});

export type HubManifestAsset = z.infer<typeof manifestAssetSchema>;
export type HubManifest = z.infer<typeof manifestSchema>;

export type HubManifestExport = {
  contractVersion: "1.0.0";
  manifest: Pick<
    HubManifest,
    | "id"
    | "name"
    | "displayName"
    | "description"
    | "version"
    | "techStacks"
    | "ides"
    | "scenarios"
    | "compatibility"
  >;
  version: string;
  checksum: string;
  installPolicy: HubManifest["installPolicy"];
  assets: Array<
    Pick<
      HubManifestAsset,
      "kind" | "assetId" | "version" | "required" | "installPath" | "checksum" | "contentUrl" | "riskLevel"
    > & {
      slug: string;
      content?: string;
      contentFormat?: string;
    }
  >;
  files: Array<{
    path: string;
    assetId: string;
    kind: z.infer<typeof assetKindSchema>;
    checksum: string;
    content?: string;
    contentFormat?: string;
  }>;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${JSON.stringify(key)}:${stableJson(val)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function assertPublishableManifest(input: unknown): HubManifest {
  const parsed = manifestSchema.safeParse(input);
  if (!parsed.success) {
    throw new HubApiError(
      "INVALID_MANIFEST",
      parsed.error.issues.map((issue) => issue.message).join("；"),
      400,
    );
  }

  const seen = new Set<string>();
  const kinds = new Set<string>();
  for (const asset of parsed.data.assets) {
    const key = `${asset.kind}:${asset.assetId}:${asset.version}`;
    if (seen.has(key)) {
      throw new HubApiError("INVALID_MANIFEST", `Manifest 存在重复资产：${key}`, 400);
    }
    if (asset.riskLevel === "L4") {
      throw new HubApiError("INVALID_MANIFEST", `资产 ${asset.assetId} 风险等级为 L4，禁止发布`, 400);
    }
    seen.add(key);
    kinds.add(asset.kind);
  }

  for (const kind of ["role", "skill", "rule", "flow"]) {
    if (!kinds.has(kind)) {
      throw new HubApiError("INVALID_MANIFEST", `Manifest 发布必须至少包含一个 ${kind} 资产`, 400);
    }
  }

  return parsed.data;
}

export function buildManifestExport(input: unknown): HubManifestExport {
  const manifest = assertPublishableManifest(input);
  const exportPayload: HubManifestExport = {
    contractVersion: "1.0.0",
    manifest: {
      id: manifest.id,
      name: manifest.name,
      displayName: manifest.displayName,
      description: manifest.description,
      version: manifest.version,
      techStacks: manifest.techStacks,
      ides: manifest.ides,
      scenarios: manifest.scenarios,
      compatibility: manifest.compatibility,
    },
    version: manifest.version,
    checksum: "",
    installPolicy: manifest.installPolicy,
    assets: manifest.assets
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((asset) => ({
        kind: asset.kind,
        assetId: asset.assetId,
        slug: asset.assetId,
        version: asset.version,
        required: asset.required,
        installPath: asset.installPath,
        checksum: asset.checksum,
        contentUrl: asset.contentUrl,
        riskLevel: asset.riskLevel,
        content: asset.content,
        contentFormat: asset.contentFormat,
      })),
    files: [],
  };
  exportPayload.files = exportPayload.assets
    .filter((asset) => Boolean(asset.installPath))
    .map((asset) => ({
      path: asset.installPath!,
      assetId: asset.assetId,
      kind: asset.kind,
      checksum: asset.checksum,
      content: asset.content,
      contentFormat: asset.contentFormat,
    }));
  exportPayload.checksum = sha256Json({
    manifest: exportPayload.manifest,
    installPolicy: exportPayload.installPolicy,
    assets: exportPayload.assets,
    files: exportPayload.files,
  });
  return exportPayload;
}

export function compareSemver(current: string, next: string) {
  const a = current.split(".").map(Number);
  const b = next.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const diff = (b[index] ?? 0) - (a[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function classifyUpgrade(current: string, next: string) {
  const [currentMajor, currentMinor] = current.split(".").map(Number);
  const [nextMajor, nextMinor] = next.split(".").map(Number);
  if (nextMajor !== currentMajor) return "major" as const;
  if (nextMinor !== currentMinor) return "minor" as const;
  return "patch" as const;
}
