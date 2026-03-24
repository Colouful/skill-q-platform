import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { checkApiRateLimit, getRequestIp } from "@/lib/api-rate-limit";
import { importRuleZip } from "@/lib/rule-zip-import";
import { importSkillZip } from "@/lib/skill-zip-import";
import { isMinioConfigured, storeSkillZipArchive } from "@/lib/minio";

export const dynamic = "force-dynamic";

/** 13.1 上传 Skill 包（ZIP），13.3–13.6 解压、校验与启发式安全扫描；可选 MinIO 归档原始包 */
export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const rl = await checkApiRateLimit(`api:upload:${ip}`, { max: 40, windowMs: 60_000 });
    if (!rl.ok) {
      return jsonErr("上传过于频繁，请稍后再试", 429);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return jsonErr("请使用 multipart 上传 file 字段（ZIP 文件）", 400);
    }
    const buf = await file.arrayBuffer();
    const originalName = file instanceof File ? file.name : "upload.zip";
    const kind = String(form.get("kind") ?? "skill").toLowerCase();

    const result =
      kind === "rule" ? await importRuleZip(buf) : await importSkillZip(buf);

    let objectStorage:
      | { stored: true; bucket: string; objectKey: string; size: number }
      | { stored: false; reason: "disabled" | "error"; message?: string } = {
      stored: false,
      reason: "disabled",
    };

    if (isMinioConfigured()) {
      try {
        const meta = await storeSkillZipArchive(buf, originalName);
        objectStorage = {
          stored: true,
          bucket: meta.bucket,
          objectKey: meta.objectKey,
          size: meta.size,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[upload] MinIO 归档失败:", message);
        objectStorage = { stored: false, reason: "error", message };
      }
    }

    return jsonOk({ ...result, objectStorage }, "解析完成");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "解析失败";
    if (msg.includes("超过") || msg.includes("Zip")) {
      return jsonErr(msg, 400);
    }
    return toApiResponse(e);
  }
}
