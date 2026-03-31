import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma";

type HubPrismaClient = PrismaClient &
  Pick<PrismaClient, "agent" | "skill" | "rule" | "roleTemplate" | "scenarioPackage">;

function databaseUrlFromEnv(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  const host = process.env.DB_HOST?.trim();
  const port = process.env.DB_PORT?.trim() || "3306";
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_DATABASE?.trim();
  if (host && user && database) {
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?charset=utf8mb3`;
  }
  throw new Error(
    "DATABASE_URL 未配置（可设置 DATABASE_URL，或 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_DATABASE）",
  );
}

function poolConfigFromDatabaseUrl(): {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  charset?: string;
  connectionLimit: number;
  acquireTimeout: number;
} {
  const raw = databaseUrlFromEnv();
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, "") || undefined;
  const charset = u.searchParams.get("charset") ?? undefined;
  const connectionLimit = Math.min(
    50,
    Math.max(5, Number(process.env.DATABASE_POOL_MAX ?? 20) || 20),
  );
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
    ...(charset ? { charset } : {}),
    connectionLimit,
    acquireTimeout: 60_000,
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: HubPrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaMariaDb(poolConfigFromDatabaseUrl());
  return new PrismaClient({ adapter }) as HubPrismaClient;
}

function isUsableClient(c: HubPrismaClient | undefined): c is HubPrismaClient {
  return (
    c !== undefined &&
    typeof c.skill?.findMany === "function" &&
    typeof c.agent?.findFirst === "function" &&
    typeof c.roleTemplate?.findMany === "function" &&
    typeof c.scenarioPackage?.findMany === "function"
  );
}

/**
 * 单例：开发环境下 HMR 可能留下旧 global，导致缺少新版 schema 的 delegate（如 `skill` 为 undefined）。
 */
function getPrismaSingleton(): HubPrismaClient {
  if (isUsableClient(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }
  const client = createClient();
  if (!isUsableClient(client)) {
    throw new Error(
      "Prisma Client 未正确初始化：缺少模型 delegate。请执行 prisma generate 并重启 dev 服务器。",
    );
  }
  globalForPrisma.prisma = client;
  return client;
}

export const prisma: HubPrismaClient = getPrismaSingleton();
