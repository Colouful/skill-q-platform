import { createHubRepository, type HubRepository } from "../repository";
import { InMemoryHubRepositoryAdapter } from "./memory/in-memory-hub-repository-adapter";
import type { HubRepositoryPort } from "./ports/hub-repository-port";
import { PrismaHubRepository } from "./prisma/prisma-hub-repository";
import type { PrismaHubClientLike, RepositoryMode } from "./repository-types";

export type HubRepositoryProvider = {
  mode: RepositoryMode;
  repository: HubRepositoryPort;
};

export type HubRepositoryFactoryOptions = {
  mode?: string;
  memoryRepository?: HubRepository;
  prismaClient?: PrismaHubClientLike;
};

function normalizeMode(mode: string | undefined): RepositoryMode {
  const value = (mode ?? process.env.HUB_REPOSITORY_MODE ?? "memory").trim().toLowerCase();
  if (value === "memory" || value === "prisma") return value;
  throw new Error(`HUB_REPOSITORY_MODE 不合法：${value}。请使用 memory 或 prisma。`);
}

export function createHubRepositoryProvider(options: HubRepositoryFactoryOptions = {}): HubRepositoryProvider {
  const mode = normalizeMode(options.mode);
  if (mode === "memory") {
    return {
      mode,
      repository: new InMemoryHubRepositoryAdapter(options.memoryRepository ?? createHubRepository()),
    };
  }

  if (!options.prismaClient) {
    throw new Error("Prisma Repository 需要注入 Prisma Client。请检查数据库连接配置，或在测试中传入 mock Prisma Client。");
  }

  return {
    mode,
    repository: new PrismaHubRepository(options.prismaClient),
  };
}
