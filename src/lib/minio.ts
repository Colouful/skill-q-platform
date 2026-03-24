import { Client } from "minio";
import { randomBytes } from "crypto";

/**
 * 可选对象存储：用于 Skill ZIP 原始包归档、审计与容灾。
 * 未设置 MINIO_* 时全站不初始化客户端，上传接口仅做内存解析（与之前一致）。
 *
 * 与自建 Nest 文件服务类似：固定 bucket（MINIO_BUCKET），对象键带时间戳与随机后缀。
 */
let client: Client | null = null;

export function isMinioConfigured(): boolean {
  return Boolean(
    process.env.MINIO_ENDPOINT?.trim() &&
      process.env.MINIO_ACCESS_KEY?.trim() &&
      process.env.MINIO_SECRET_KEY?.trim() &&
      process.env.MINIO_BUCKET?.trim(),
  );
}

export function getMinioClient(): Client {
  if (!isMinioConfigured()) {
    throw new Error("MinIO 未配置：请设置 MINIO_ENDPOINT、MINIO_ACCESS_KEY、MINIO_SECRET_KEY、MINIO_BUCKET");
  }
  if (!client) {
    const port = parseInt(process.env.MINIO_PORT || "9000", 10);
    client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!.trim(),
      port: Number.isFinite(port) ? port : 9000,
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY!.trim(),
      secretKey: process.env.MINIO_SECRET_KEY!.trim(),
    });
  }
  return client;
}

export async function ensureBucketExists(bucket: string): Promise<void> {
  const c = getMinioClient();
  const exists = await c.bucketExists(bucket);
  if (!exists) {
    const region = process.env.MINIO_REGION?.trim() ?? "";
    await c.makeBucket(bucket, region);
  }
}

/** 将原始 ZIP 写入 MinIO；仅应在 isMinioConfigured() 为 true 时调用 */
export async function storeSkillZipArchive(
  buffer: ArrayBuffer,
  originalFileName: string,
): Promise<{ bucket: string; objectKey: string; size: number }> {
  const bucket = process.env.MINIO_BUCKET!.trim();
  const rawPrefix =
    process.env.MINIO_OBJECT_PREFIX?.trim() || "xiaqiu-hub/skill-imports";
  const prefix = rawPrefix.replace(/^\/+|\/+$/g, "");
  const stamp = Date.now();
  const rand = randomBytes(8).toString("hex");
  const stem = originalFileName.replace(/\.zip$/i, "").replace(/[^\w.\-]+/g, "_").slice(0, 64) || "upload";
  const objectKey = `${prefix}/${stamp}_${rand}_${stem}.zip`;

  const c = getMinioClient();
  await ensureBucketExists(bucket);
  const buf = Buffer.from(buffer);
  await c.putObject(bucket, objectKey, buf, buf.length, {
    "Content-Type": "application/zip",
  });

  return { bucket, objectKey, size: buf.length };
}
