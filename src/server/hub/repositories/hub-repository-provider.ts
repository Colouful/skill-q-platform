import { defaultHubRepository } from "../seed";
import type { HubRepository } from "../repository";
import { createHubRepositoryProvider as createRepositoryFactoryProvider } from "./repository-factory";
import type { HubRepositoryPort } from "./ports/hub-repository-port";
import type { PrismaHubClientLike, RepositoryMode } from "./repository-types";

export type HubRepositoryMode = RepositoryMode;

export interface HubRepositoryProviderOptions {
  mode?: HubRepositoryMode;
  memoryRepository?: HubRepository;
  prismaClient?: PrismaHubClientLike;
}

function resolveMode(mode?: HubRepositoryMode): HubRepositoryMode {
  const value = (mode ?? process.env.HUB_REPOSITORY_MODE ?? "memory").trim().toLowerCase();
  if (value === "memory" || value === "prisma") return value;
  throw new Error(`HUB_REPOSITORY_MODE 不合法：${value}。请使用 memory 或 prisma。`);
}

export function createHubRepositoryProvider(options: HubRepositoryProviderOptions = {}): HubRepositoryPort {
  const mode = resolveMode(options.mode);
  if (mode === "prisma" && !options.prismaClient) {
    throw new Error("Prisma 查询仓储需要注入 Prisma Client。请检查 Repository Provider 配置。");
  }
  return createRepositoryFactoryProvider({
    mode,
    memoryRepository: options.memoryRepository ?? defaultHubRepository,
    prismaClient: options.prismaClient,
  }).repository;
}

export function getHubRepositoryProvider(options: Omit<HubRepositoryProviderOptions, "prismaClient"> = {}): HubRepositoryPort {
  const mode = resolveMode(options.mode);
  if (mode === "memory") {
    return createHubRepositoryProvider({
      ...options,
      mode,
      memoryRepository: options.memoryRepository ?? defaultHubRepository,
    });
  }

  try {
    const { prisma } = require("@/lib/prisma") as { prisma: PrismaHubClientLike };
    return createHubRepositoryProvider({ ...options, mode, prismaClient: prisma });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma 查询仓储初始化失败：${message}`);
  }
}
