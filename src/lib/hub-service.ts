import { createHash } from "node:crypto";
import { z } from "zod";
import { buildManifestExport, sha256Json, type HubManifest } from "@/lib/hub-manifest";
import { HubApiError } from "@/lib/hub-response";
import { prisma } from "@/lib/prisma";

const listQuerySchema = z.object({
  q: z.string().optional(),
  kind: z.string().optional(),
  status: z.string().optional(),
});

const assetCreateSchema = z.object({
  assetId: z.string().min(1),
  kind: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  teamId: z.string().optional(),
  status: z.string().default("draft"),
  riskLevel: z.string().default("L0"),
  tags: z.array(z.string()).default([]),
  version: z.string().default("1.0.0"),
  content: z.string().optional(),
  contentFormat: z.string().default("markdown"),
  checksum: z.string().optional(),
  contentUrl: z.string().url().optional(),
});

const manifestCreateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().default(""),
  version: z.string().default("1.0.0"),
  status: z.string().default("draft"),
  techStacks: z.array(z.string()).default([]),
  ides: z.array(z.string()).default([]),
  scenarios: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  installPolicy: z.record(z.string(), z.unknown()).default({ mode: "standard" }),
  compatibility: z.record(z.string(), z.unknown()).default({ minCliVersion: "0.1.11" }),
  assets: z
    .array(
      z.object({
        kind: z.string(),
        assetId: z.string(),
        version: z.string(),
        required: z.boolean().default(true),
        installPath: z.string().optional(),
        checksum: z.string().min(1),
        riskLevel: z.string().default("L0"),
        contentUrl: z.string().url().optional(),
        content: z.string().optional(),
        contentFormat: z.string().optional(),
        order: z.number().int().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .default([]),
});

const installReportSchema = z.object({
  projectName: z.string().min(1),
  repoUrl: z.string().optional(),
  manifestId: z.string().min(1),
  manifestVersion: z.string().min(1),
  installMode: z.string().default("standard"),
  status: z.enum(["success", "failed", "partial", "rollback"]),
  assets: z.array(z.unknown()).default([]),
  message: z.string().optional(),
});

const runtimeReportSchema = z.object({
  projectName: z.string().min(1),
  repoUrl: z.string().optional(),
  manifestId: z.string().optional(),
  manifestVersion: z.string().optional(),
  runId: z.string().min(1),
  stage: z.enum(["requirement", "design", "implement", "test", "review", "archive"]),
  status: z.enum(["success", "failed", "partial"]),
  usedAssets: z.array(z.object({ kind: z.string(), assetId: z.string(), version: z.string() })).default([]),
  durationMs: z.number().int().nonnegative().default(0),
  failedReason: z.string().optional(),
});

function asPrisma() {
  return prisma as unknown as {
    hubAsset: any;
    hubAssetVersion: any;
    hubManifest: any;
    hubManifestVersion: any;
    hubManifestAsset: any;
    hubAssetAuditLog: any;
    hubInstallRecord: any;
    hubRuntimeReport: any;
  };
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parseOrInvalid<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new HubApiError(
      "INVALID_MANIFEST",
      parsed.error.issues.map((issue) => issue.message).join("；"),
      400,
    );
  }
  return parsed.data;
}

async function audit(action: string, resourceType: string, resourceId: string, details: unknown) {
  await asPrisma().hubAssetAuditLog.create({
    data: { action, resourceType, resourceId, details: details as object },
  });
}

function isMissingHubTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  return (
    maybe.code === "P2021" ||
    maybe.code === "P2022" ||
    /hub_(asset|manifest|install|runtime)|doesn't exist|does not exist|Unknown table/i.test(
      maybe.message || "",
    )
  );
}

export async function listHubAssets(searchParams: URLSearchParams) {
  const query = listQuerySchema.parse(Object.fromEntries(searchParams.entries()));
  try {
    return await asPrisma().hubAsset.findMany({
      where: {
        ...(query.kind ? { kind: query.kind } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { assetId: { contains: query.q } },
                { name: { contains: query.q } },
                { displayName: { contains: query.q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  } catch (error) {
    if (isMissingHubTable(error)) return [];
    throw error;
  }
}

export async function searchHubRegistry(searchParams: URLSearchParams) {
  const q = searchParams.get("q")?.trim() || "";
  const kind = searchParams.get("kind")?.trim();
  const [assets, manifests] = await Promise.all([
    kind === "manifest"
      ? Promise.resolve([])
      : listHubAssets(new URLSearchParams({ ...(q ? { q } : {}), ...(kind && kind !== "asset" && kind !== "all" ? { kind } : {}) })),
    kind && kind !== "manifest"
      ? Promise.resolve([])
      : listHubManifests(new URLSearchParams({ ...(q ? { q } : {}), status: "published" })),
  ]);
  return { q, kind: kind || "all", manifests, assets };
}

export async function exportHubRegistry(req: Request) {
  const baseUrl = new URL(req.url).origin;
  const [assets, manifests] = await Promise.all([
    listHubAssets(new URLSearchParams({ status: "published" })),
    listHubManifests(new URLSearchParams({ status: "published" })),
  ]);
  return {
    contractVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    hub: {
      id: "skill-q-platform",
      name: "Xia Qiu Hub",
      baseUrl,
    },
    assets,
    manifests,
  };
}

export async function createHubAsset(raw: unknown) {
  const input = parseOrInvalid(assetCreateSchema, raw);
  const checksum = input.checksum || (input.content ? sha256Text(input.content) : sha256Json({ assetId: input.assetId }));
  const asset = await asPrisma().hubAsset.upsert({
    where: { assetId: input.assetId },
    update: {
      kind: input.kind,
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      ownerId: input.ownerId,
      teamId: input.teamId,
      status: input.status,
      riskLevel: input.riskLevel,
      tags: input.tags,
    },
    create: {
      assetId: input.assetId,
      kind: input.kind,
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      ownerId: input.ownerId,
      teamId: input.teamId,
      status: input.status,
      riskLevel: input.riskLevel,
      tags: input.tags,
    },
  });
  await asPrisma().hubAssetVersion.upsert({
    where: { assetId_version: { assetId: input.assetId, version: input.version } },
    update: {
      content: input.content,
      contentFormat: input.contentFormat,
      checksum,
      contentUrl: input.contentUrl,
      status: input.status === "published" ? "published" : "draft",
    },
    create: {
      assetId: input.assetId,
      version: input.version,
      content: input.content,
      contentFormat: input.contentFormat,
      checksum,
      contentUrl: input.contentUrl,
      status: input.status === "published" ? "published" : "draft",
    },
  });
  await audit("create", "asset", input.assetId, { version: input.version });
  return asset;
}

export async function listHubManifests(searchParams: URLSearchParams) {
  const query = listQuerySchema.parse(Object.fromEntries(searchParams.entries()));
  try {
    return await asPrisma().hubManifest.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { manifestId: { contains: query.q } },
                { name: { contains: query.q } },
                { displayName: { contains: query.q } },
              ],
            }
          : {}),
      },
      include: { assets: { orderBy: { sortOrder: "asc" } }, versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  } catch (error) {
    if (isMissingHubTable(error)) return [];
    throw error;
  }
}

export async function createHubManifest(raw: unknown) {
  const input = parseOrInvalid(manifestCreateSchema, raw);
  const manifest = await asPrisma().hubManifest.upsert({
    where: { manifestId: input.id },
    update: {
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      status: input.status,
      techStacks: input.techStacks,
      ides: input.ides,
      scenarios: input.scenarios,
      tags: input.tags,
    },
    create: {
      manifestId: input.id,
      name: input.name,
      displayName: input.displayName,
      description: input.description,
      status: input.status,
      techStacks: input.techStacks,
      ides: input.ides,
      scenarios: input.scenarios,
      tags: input.tags,
    },
  });

  if (input.assets.length > 0) {
    await asPrisma().hubManifestAsset.deleteMany({ where: { manifestId: input.id } });
    await asPrisma().hubManifestAsset.createMany({
      data: input.assets.map((asset, index) => ({
        manifestId: input.id,
        kind: asset.kind,
        assetId: asset.assetId,
        version: asset.version,
        required: asset.required,
        installPath: asset.installPath,
        checksum: asset.checksum,
        sortOrder: asset.order ?? index,
        config: asset.config ?? {},
      })),
    });
  }
  await audit("create", "manifest", input.id, { version: input.version, assets: input.assets.length });
  return manifest;
}

async function loadManifestForExport(manifestId: string, version?: string): Promise<HubManifest> {
  const manifest = await asPrisma().hubManifest.findUnique({
    where: { manifestId },
    include: {
      assets: { orderBy: { sortOrder: "asc" } },
      versions: {
        where: version ? { version } : { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!manifest) throw new HubApiError("MANIFEST_NOT_FOUND", "Manifest 不存在", 404);

  const published = manifest.versions[0];
  const snapshot = published?.exportSnapshot as Partial<HubManifest> | undefined;
  const assets = await Promise.all(
    manifest.assets.map(async (asset: any) => {
      const hubAsset = await asPrisma().hubAsset.findUnique({
        where: { assetId: asset.assetId },
        include: { versions: { where: { version: asset.version }, take: 1 } },
      });
      if (!hubAsset) {
        throw new HubApiError("ASSET_NOT_FOUND", `Manifest 引用的资产不存在：${asset.assetId}`, 404);
      }
      const assetVersion = hubAsset?.versions?.[0];
      if (!assetVersion) {
        throw new HubApiError("ASSET_NOT_FOUND", `Manifest 引用的资产版本不存在：${asset.assetId}@${asset.version}`, 404);
      }
      if (hubAsset.status !== "published" || assetVersion.status !== "published") {
        throw new HubApiError("INVALID_MANIFEST", `资产 ${asset.assetId}@${asset.version} 未发布，不能发布 Manifest`, 400);
      }
      return {
        kind: asset.kind,
        assetId: asset.assetId,
        version: asset.version,
        required: asset.required,
        installPath: asset.installPath || undefined,
        checksum: assetVersion?.checksum || asset.checksum,
        order: asset.sortOrder,
        riskLevel: hubAsset?.riskLevel || "L0",
        contentUrl: assetVersion?.contentUrl || undefined,
        content: assetVersion?.content || undefined,
        contentFormat: assetVersion?.contentFormat || undefined,
      };
    }),
  );
  return {
    id: manifest.manifestId,
    name: manifest.name,
    displayName: manifest.displayName,
    description: manifest.description || "",
    version: published?.version || version || "1.0.0",
    status: manifest.status,
    techStacks: (manifest.techStacks as string[]) || [],
    ides: (manifest.ides as string[]) || [],
    scenarios: (manifest.scenarios as string[]) || [],
    installPolicy: (published?.installPolicy as HubManifest["installPolicy"]) || snapshot?.installPolicy || { mode: "standard" },
    compatibility:
      (published?.compatibility as HubManifest["compatibility"]) ||
      snapshot?.compatibility ||
      { minCliVersion: "0.1.11" },
    assets,
  };
}

export async function publishHubManifest(manifestId: string, raw: unknown) {
  const body = z
    .object({
      version: z.string().default("1.0.0"),
      releaseNote: z.string().optional(),
      installPolicy: z.record(z.string(), z.unknown()).default({ mode: "standard" }),
      compatibility: z.record(z.string(), z.unknown()).default({ minCliVersion: "0.1.11" }),
    })
    .parse(raw ?? {});
  const draft = await loadManifestForExport(manifestId, body.version);
  const exportPayload = buildManifestExport({
    ...draft,
    version: body.version,
    status: "published",
    installPolicy: body.installPolicy,
    compatibility: body.compatibility,
  });

  await asPrisma().hubManifestVersion.upsert({
    where: { manifestId_version: { manifestId, version: body.version } },
    update: {
      checksum: exportPayload.checksum,
      installPolicy: body.installPolicy,
      compatibility: body.compatibility,
      exportSnapshot: exportPayload,
      releaseNote: body.releaseNote,
      status: "published",
      publishedAt: new Date(),
    },
    create: {
      manifestId,
      version: body.version,
      checksum: exportPayload.checksum,
      installPolicy: body.installPolicy,
      compatibility: body.compatibility,
      exportSnapshot: exportPayload,
      releaseNote: body.releaseNote,
      status: "published",
      publishedAt: new Date(),
    },
  });
  await asPrisma().hubManifest.update({ where: { manifestId }, data: { status: "published" } });
  await audit("publish", "manifest", manifestId, { version: body.version, checksum: exportPayload.checksum });
  return exportPayload;
}

export async function exportHubManifest(manifestId: string, version?: string) {
  const manifest = await loadManifestForExport(manifestId, version);
  return buildManifestExport({ ...manifest, status: "published" });
}

export async function previewHubInstall(raw: unknown) {
  const input = z.object({ manifestId: z.string(), version: z.string().optional() }).parse(raw);
  const payload = await exportHubManifest(input.manifestId, input.version);
  return {
    manifestId: payload.manifest.id,
    version: payload.version,
    checksum: payload.checksum,
    files: payload.assets.map((asset) => ({
      path: asset.installPath || `.agents/registry/${asset.kind}/${asset.assetId}.json`,
      action: "create",
      required: asset.required,
      checksum: asset.checksum,
    })),
    warnings: payload.assets.some((asset) => asset.riskLevel === "L3")
      ? ["存在高风险资产，CLI 需要 --allow-high-risk 才能安装。"]
      : [],
  };
}

export async function reportHubInstall(raw: unknown) {
  const input = parseOrInvalid(installReportSchema, raw);
  const record = await asPrisma().hubInstallRecord.create({ data: input });
  await audit("install", "manifest", input.manifestId, {
    projectName: input.projectName,
    version: input.manifestVersion,
    status: input.status,
  });
  return record;
}

export async function reportHubRuntime(raw: unknown) {
  const input = parseOrInvalid(runtimeReportSchema, raw);
  const record = await asPrisma().hubRuntimeReport.create({ data: input });
  await audit("runtime-report", "manifest", input.manifestId || "unknown", {
    projectName: input.projectName,
    runId: input.runId,
    status: input.status,
  });
  return record;
}
