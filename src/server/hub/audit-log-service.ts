import { AUDIT_LOG_ERROR } from "./audit-log-errors";
import { HubError } from "./errors";
import { InMemoryHubRepositoryAdapter } from "./repositories/memory/in-memory-hub-repository-adapter";
import type { AuditLogRepositoryPort } from "./repositories/ports/audit-log-repository-port";
import { PrismaAuditLogRepository } from "./repositories/prisma/prisma-audit-log-repository";
import type { AuditLogListQuery, HubAuditLogCreateInput, PrismaHubClientLike } from "./repositories/repository-types";
import { defaultHubRepository } from "./seed";

type AuditLogInput = Omit<HubAuditLogCreateInput, "operatorId" | "operatorName" | "operatorType"> & {
  operator?: string;
  operatorId?: string;
  operatorName?: string;
  operatorType?: string;
};

type QueryInput = URLSearchParams | Record<string, string | number | undefined>;

export const defaultMemoryAuditRepository = new InMemoryHubRepositoryAdapter(defaultHubRepository);

function get(input: QueryInput, key: string) {
  return input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key];
}

function normalizeQuery(input: QueryInput = {}): AuditLogListQuery {
  const page = Number(get(input, "page") ?? 1);
  const pageSize = Number(get(input, "pageSize") ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw AUDIT_LOG_ERROR.invalidQuery();
  }
  const value = (key: string) => {
    const item = get(input, key);
    return item === undefined ? undefined : String(item).trim() || undefined;
  };
  return {
    targetType: value("targetType"),
    targetId: value("targetId"),
    action: value("action"),
    operatorId: value("operatorId"),
    page,
    pageSize,
  };
}

function defaultRepository(): AuditLogRepositoryPort {
  if ((process.env.HUB_REPOSITORY_MODE ?? "memory").trim().toLowerCase() !== "prisma") {
    return defaultMemoryAuditRepository;
  }
  // 按环境开关懒加载 Prisma，避免 memory 测试路径误连数据库。
  const { prisma } = require("@/lib/prisma") as { prisma: PrismaHubClientLike };
  return new PrismaAuditLogRepository(prisma);
}

export class AuditLogService {
  constructor(private readonly repository: AuditLogRepositoryPort = defaultRepository()) {}

  async createAuditLog(input: AuditLogInput) {
    try {
      return await this.repository.createAuditLog({
        ...input,
        operatorId: input.operatorId ?? input.operator ?? "system",
        operatorName: input.operatorName ?? (input.operator && input.operator !== "system" ? input.operator : "系统"),
        operatorType: input.operatorType ?? "system",
      });
    } catch (error) {
      if (error instanceof HubError) throw error;
      throw AUDIT_LOG_ERROR.createFailed(error instanceof Error ? error.message : undefined);
    }
  }

  async append(input: AuditLogInput) {
    return this.createAuditLog(input);
  }

  async listAuditLogs(input: QueryInput = {}) {
    try {
      return await this.repository.listAuditLogs(normalizeQuery(input));
    } catch (error) {
      if (error instanceof HubError) throw error;
      if (error instanceof Error && error.message.includes("分页参数不合法")) throw AUDIT_LOG_ERROR.invalidQuery();
      throw AUDIT_LOG_ERROR.queryFailed(error instanceof Error ? error.message : undefined);
    }
  }

  async list(input: QueryInput = {}) {
    return this.listAuditLogs(input);
  }

  clear() {
    const repository = this.repository as AuditLogRepositoryPort & { clearAuditLogs?: () => void };
    repository.clearAuditLogs?.();
  }

  getRepositoryForTransaction() {
    return this.repository;
  }
}
