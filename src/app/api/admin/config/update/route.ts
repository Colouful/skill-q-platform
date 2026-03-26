import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { prisma } from "@/lib/prisma";
import { invalidateMaintenanceCache } from "@/lib/system-config";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";
import { z } from "zod";

export const dynamic = "force-dynamic";

const allowedKeys = new Set<string>(Object.values(SYSTEM_CONFIG_KEYS));

const bodySchema = z.object({
  key: z.string().min(1).max(64),
  value: z.string().max(65535),
});

function validateValue(
  key: string,
  value: string,
): { ok: true; value: string } | { ok: false; message: string } {
  const v = value.trim();
  switch (key) {
    case SYSTEM_CONFIG_KEYS.SITE_NAME:
      if (v.length < 1 || v.length > 200) return { ok: false, message: "站点名称长度 1–200" };
      return { ok: true, value: v };
    case SYSTEM_CONFIG_KEYS.SITE_URL: {
      if (v.length < 1) return { ok: false, message: "站点 URL 不能为空" };
      try {
        const u = new URL(v.startsWith("http") ? v : `https://${v}`);
        return { ok: true, value: u.toString() };
      } catch {
        return { ok: false, message: "站点 URL 格式无效" };
      }
    }
    case SYSTEM_CONFIG_KEYS.DEFAULT_DOWNLOAD_POLICY:
      if (!["public", "login", "author"].includes(v)) {
        return { ok: false, message: "默认下载策略须为 public / login / author" };
      }
      return { ok: true, value: v };
    case SYSTEM_CONFIG_KEYS.REGISTER_MAX_PER_HOUR: {
      const n = parseInt(v, 10);
      if (!Number.isFinite(n) || n < 1 || n > 1000) {
        return { ok: false, message: "注册速率限制须为 1–1000（每小时每 IP）" };
      }
      return { ok: true, value: String(n) };
    }
    case SYSTEM_CONFIG_KEYS.MAINTENANCE_MODE: {
      const low = v.toLowerCase();
      if (!["true", "false", "0", "1"].includes(low)) {
        return { ok: false, message: "维护模式须为 true / false" };
      }
      return { ok: true, value: low === "true" || v === "1" ? "true" : "false" };
    }
    case SYSTEM_CONFIG_KEYS.UPLOAD_REQUIRES_LOGIN: {
      const low = v.toLowerCase();
      if (!["true", "false", "0", "1"].includes(low)) {
        return { ok: false, message: "上传需登录须为 true / false" };
      }
      return { ok: true, value: low === "true" || v === "1" ? "true" : "false" };
    }
    case SYSTEM_CONFIG_KEYS.RESOURCE_UPLOAD_REQUIRES_MODERATION: {
      const low = v.toLowerCase();
      if (!["true", "false", "0", "1"].includes(low)) {
        return { ok: false, message: "上传需人工审核须为 true / false" };
      }
      return { ok: true, value: low === "true" || v === "1" ? "true" : "false" };
    }
    default:
      return { ok: false, message: "不支持的配置项" };
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const { key: rawKey, value } = parsed.data;
    if (!allowedKeys.has(rawKey)) {
      return jsonErr("不支持的配置项", 400);
    }

    const result = validateValue(rawKey, value);
    if (!result.ok) {
      return jsonErr(result.message, 400);
    }

    await prisma.systemConfig.upsert({
      where: { configKey: rawKey },
      create: { configKey: rawKey, configValue: result.value },
      update: { configValue: result.value },
    });

    if (rawKey === SYSTEM_CONFIG_KEYS.MAINTENANCE_MODE) {
      invalidateMaintenanceCache();
    }

    return jsonOk({ key: rawKey, value: result.value }, "已保存");
  } catch (e) {
    return toApiResponse(e);
  }
}
