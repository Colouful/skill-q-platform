import { jsonOk } from "@/lib/api-response";
import { isMinioConfigured } from "@/lib/minio";

export const dynamic = "force-dynamic";

/** GET：对象存储是否就绪（不返回密钥与具体 endpoint） */
export async function GET() {
  return jsonOk({
    minio: isMinioConfigured() ? "ready" : "disabled",
    bucket: process.env.MINIO_BUCKET?.trim() ?? null,
  });
}
