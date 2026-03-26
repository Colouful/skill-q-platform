import { prisma } from "@/lib/prisma";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

/** 表尚未迁移时（P2021），回退到仅内存默认值，避免中间件/注册接口 500 */
function isTableMissingError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2021";
}

type DownloadPolicy = "public" | "login" | "author";

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function defaultMap(): Record<string, string> {
  return {
    [SYSTEM_CONFIG_KEYS.SITE_NAME]: "虾球Hub",
    [SYSTEM_CONFIG_KEYS.SITE_URL]: DEFAULT_SITE_URL,
    [SYSTEM_CONFIG_KEYS.DEFAULT_DOWNLOAD_POLICY]: "public",
    [SYSTEM_CONFIG_KEYS.REGISTER_MAX_PER_HOUR]: "10",
    [SYSTEM_CONFIG_KEYS.MAINTENANCE_MODE]: "false",
    [SYSTEM_CONFIG_KEYS.UPLOAD_REQUIRES_LOGIN]: "false",
    [SYSTEM_CONFIG_KEYS.RESOURCE_UPLOAD_REQUIRES_MODERATION]: "true",
  };
}

/** 合并默认值与数据库 */
export async function getSystemConfigMap(): Promise<Record<string, string>> {
  const base = defaultMap();
  try {
    const rows = await prisma.systemConfig.findMany();
    for (const r of rows) {
      base[r.configKey] = r.configValue;
    }
  } catch (e) {
    if (isTableMissingError(e)) {
      return base;
    }
    throw e;
  }
  return base;
}

let maintenanceCache: { at: number; value: boolean } | null = null;
const MAINTENANCE_CACHE_MS = 5000;

/** 仅读维护开关一行，避免 findMany 全表（中间件/接口会频繁触发） */
export async function getMaintenanceModeCached(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.at < MAINTENANCE_CACHE_MS) {
    return maintenanceCache.value;
  }
  try {
    const row = await prisma.systemConfig.findUnique({
      where: { configKey: SYSTEM_CONFIG_KEYS.MAINTENANCE_MODE },
      select: { configValue: true },
    });
    const raw = row?.configValue?.toLowerCase().trim() ?? "";
    const value = raw === "true" || raw === "1" || raw === "yes";
    maintenanceCache = { at: now, value };
    return value;
  } catch (e) {
    if (isTableMissingError(e)) {
      maintenanceCache = { at: now, value: false };
      return false;
    }
    throw e;
  }
}

export function invalidateMaintenanceCache() {
  maintenanceCache = null;
}

export async function getRegisterMaxPerHour(): Promise<number> {
  const map = await getSystemConfigMap();
  const raw = map[SYSTEM_CONFIG_KEYS.REGISTER_MAX_PER_HOUR];
  const n = parseInt(String(raw ?? "10"), 10);
  if (!Number.isFinite(n) || n < 1) return 10;
  return Math.min(1000, n);
}

export async function getDefaultDownloadPolicy(): Promise<DownloadPolicy> {
  const map = await getSystemConfigMap();
  const raw = map[SYSTEM_CONFIG_KEYS.DEFAULT_DOWNLOAD_POLICY]?.toLowerCase().trim();
  if (raw === "login" || raw === "author" || raw === "public") return raw;
  return "public";
}

export async function getUploadRequiresLogin(): Promise<boolean> {
  const map = await getSystemConfigMap();
  const raw = map[SYSTEM_CONFIG_KEYS.UPLOAD_REQUIRES_LOGIN]?.toLowerCase().trim();
  return raw === "true" || raw === "1" || raw === "yes";
}

export async function getResourceUploadRequiresModeration(): Promise<boolean> {
  const map = await getSystemConfigMap();
  const raw =
    map[SYSTEM_CONFIG_KEYS.RESOURCE_UPLOAD_REQUIRES_MODERATION]?.toLowerCase().trim();
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
}
