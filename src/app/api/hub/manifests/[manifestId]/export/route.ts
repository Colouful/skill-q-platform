import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildHubManifestExportPayload,
  type HubManifestExportAssetRow,
  type HubManifestExportAssetVersionRow,
  type HubManifestExportManifestRow,
  type HubManifestExportVersionRow,
} from "@/lib/hub-manifest-export";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HubEnvelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
  requestId: string;
  contractVersion: "1.0.0";
};

function hubJson<T>(body: Omit<HubEnvelope<T>, "requestId" | "contractVersion">, init?: ResponseInit) {
  return NextResponse.json(
    {
      ...body,
      requestId: randomUUID(),
      contractVersion: "1.0.0",
    } satisfies HubEnvelope<T>,
    {
      ...init,
      headers: {
        "Cache-Control": "no-store",
        ...init?.headers,
      },
    },
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ manifestId: string }> },
) {
  try {
    const { manifestId } = await params;
    const normalizedManifestId = decodeURIComponent(manifestId).trim();
    if (!normalizedManifestId) {
      return hubJson(
        {
          success: false,
          code: "BAD_REQUEST",
          message: "Manifest ID 不能为空",
          data: null,
        },
        { status: 400 },
      );
    }

    const requestedVersion = new URL(req.url).searchParams.get("version")?.trim();

    const manifests = await prisma.$queryRawUnsafe<HubManifestExportManifestRow[]>(
      `
        SELECT manifestId, name, displayName, description, status, techStacks, ides, scenarios
        FROM hub_manifest
        WHERE manifestId = ? OR name = ?
        LIMIT 1
      `,
      normalizedManifestId,
      normalizedManifestId,
    );
    const manifest = manifests[0];

    if (!manifest || manifest.status !== "published") {
      return hubJson(
        {
          success: false,
          code: "NOT_FOUND",
          message: "Manifest 不存在或未发布",
          data: null,
        },
        { status: 404 },
      );
    }

    const versions = requestedVersion
      ? await prisma.$queryRawUnsafe<HubManifestExportVersionRow[]>(
          `
            SELECT version, checksum, installPolicy, compatibility, exportSnapshot, status
            FROM hub_manifest_version
            WHERE manifestId = ? AND version = ? AND status = 'published'
            ORDER BY publishedAt DESC, createdAt DESC
            LIMIT 1
          `,
          manifest.manifestId,
          requestedVersion,
        )
      : await prisma.$queryRawUnsafe<HubManifestExportVersionRow[]>(
          `
            SELECT version, checksum, installPolicy, compatibility, exportSnapshot, status
            FROM hub_manifest_version
            WHERE manifestId = ? AND status = 'published'
            ORDER BY publishedAt DESC, createdAt DESC
            LIMIT 1
          `,
          manifest.manifestId,
        );
    const version = versions[0];

    if (!version) {
      return hubJson(
        {
          success: false,
          code: "NOT_FOUND",
          message: "Manifest 发布版本不存在",
          data: null,
        },
        { status: 404 },
      );
    }

    const assets = await prisma.$queryRawUnsafe<HubManifestExportAssetRow[]>(
      `
        SELECT kind, assetId, version, required, installPath, checksum, sortOrder, config
        FROM hub_manifest_asset
        WHERE manifestId = ?
        ORDER BY sortOrder ASC, createdAt ASC
      `,
      manifest.manifestId,
    );

    const assetVersions = await prisma.$queryRawUnsafe<HubManifestExportAssetVersionRow[]>(
      `
        SELECT
          hma.assetId,
          hma.version,
          hav.content,
          COALESCE(hav.contentFormat, 'markdown') AS contentFormat,
          COALESCE(hav.checksum, hma.checksum) AS checksum,
          hav.contentUrl,
          ha.riskLevel,
          COALESCE(hav.status, 'missing') AS status
        FROM hub_manifest_asset hma
        LEFT JOIN hub_asset ha ON ha.assetId = hma.assetId
        LEFT JOIN hub_asset_version hav ON hav.assetId = hma.assetId AND hav.version = hma.version
        WHERE hma.manifestId = ?
        ORDER BY hma.sortOrder ASC, hav.createdAt DESC
      `,
      manifest.manifestId,
    );

    const payload = buildHubManifestExportPayload({
      manifest,
      version,
      assets,
      assetVersions,
    });

    return hubJson({
      success: true,
      code: "OK",
      message: "操作成功",
      data: payload,
    });
  } catch (error) {
    console.error("[hub manifest export]", error);
    return hubJson(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "服务器错误，请稍后重试",
        data: null,
      },
      { status: 500 },
    );
  }
}
