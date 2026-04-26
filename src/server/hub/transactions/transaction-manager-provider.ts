import { defaultHubRepository } from "../seed";
import { HubError } from "../errors";
import { defaultMemoryAuditRepository } from "../audit-log-service";
import type { HubRepository } from "../repository";
import type { PrismaTransactionalHubClientLike, RepositoryMode } from "../repositories/repository-types";
import { MemoryTransactionManager } from "./memory-transaction-manager";
import { PrismaTransactionManager } from "./prisma-transaction-manager";
import type { TransactionManagerPort } from "./transaction-manager-port";

export type HubTransactionManagerOptions = {
  mode?: RepositoryMode;
  memoryRepository?: HubRepository;
  prismaClient?: PrismaTransactionalHubClientLike;
};

function resolveMode(mode?: RepositoryMode): RepositoryMode {
  const value = (mode ?? process.env.HUB_REPOSITORY_MODE ?? "memory").trim().toLowerCase();
  if (value === "memory" || value === "prisma") return value;
  throw new HubError("INVALID_REPOSITORY_MODE", `HUB_REPOSITORY_MODE 不合法：${value}`, "请使用 memory 或 prisma。", 400);
}

export function createHubTransactionManager(options: HubTransactionManagerOptions = {}): TransactionManagerPort {
  const mode = resolveMode(options.mode);
  if (mode === "memory") {
    const memoryRepository = options.memoryRepository ?? defaultHubRepository;
    const adapter = memoryRepository === defaultHubRepository ? defaultMemoryAuditRepository : undefined;
    return new MemoryTransactionManager(memoryRepository, adapter);
  }
  if (!options.prismaClient) {
    throw new HubError("PRISMA_TRANSACTION_CLIENT_REQUIRED", "Prisma 写事务需要注入 Prisma Client", "请检查数据库连接配置。", 500);
  }
  return new PrismaTransactionManager(options.prismaClient);
}

export function getHubTransactionManager(options: Omit<HubTransactionManagerOptions, "prismaClient"> = {}): TransactionManagerPort {
  const mode = resolveMode(options.mode);
  if (mode === "memory") {
    return createHubTransactionManager({
      ...options,
      mode,
      memoryRepository: options.memoryRepository ?? defaultHubRepository,
    });
  }
  try {
    const { prisma } = require("@/lib/prisma") as { prisma: PrismaTransactionalHubClientLike };
    return createHubTransactionManager({ ...options, mode, prismaClient: prisma });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new HubError("PRISMA_TRANSACTION_INIT_FAILED", `Prisma 写事务初始化失败：${message}`, "请检查数据库连接配置。", 500);
  }
}
