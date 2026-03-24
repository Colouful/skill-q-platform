import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma";

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
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL 未配置");
  }
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
  prisma: PrismaClient | undefined;
};

function createClient() {
  const adapter = new PrismaMariaDb(poolConfigFromDatabaseUrl());
  return new PrismaClient({ adapter });
}

function isUsableClient(c: PrismaClient | undefined): c is PrismaClient {
  return (
    c !== undefined &&
    typeof (c as PrismaClient).skill?.findMany === "function" &&
    typeof (c as PrismaClient).agent?.findFirst === "function"
  );
}

/**
 * 单例：开发环境下 HMR 可能留下旧 global，导致缺少新版 schema 的 delegate（如 `skill` 为 undefined）。
 */
function getPrismaSingleton(): PrismaClient {
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

export const prisma = getPrismaSingleton();
