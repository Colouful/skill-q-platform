import { randomUUID } from "node:crypto";
import { assertSafeAuditLogPayload } from "../../audit-log-privacy";
import type { AuditLogRepositoryPort } from "../ports/audit-log-repository-port";
import type { AuditLogListQuery, HubAuditLogCreateInput, PrismaHubClientLike } from "../repository-types";
import { parsePagination } from "../repository-types";
import { mapPrismaAuditLog } from "./prisma-mappers";

function nullable(value: string | undefined) {
  return value && value.trim().length > 0 ? value : null;
}

function buildWhere(query: AuditLogListQuery = {}) {
  return {
    ...(query.targetType ? { targetType: query.targetType } : {}),
    ...(query.targetId ? { targetId: query.targetId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.operatorId ? { operatorId: query.operatorId } : {}),
  };
}

export class PrismaAuditLogRepository implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaHubClientLike) {}

  async createAuditLog(input: HubAuditLogCreateInput) {
    assertSafeAuditLogPayload(input.metadata);
    const record = await this.prisma.hubAuditLog.create({
      data: {
        id: input.id ?? randomUUID(),
        targetType: input.targetType,
        targetId: input.targetId,
        targetSlug: nullable(input.targetSlug),
        targetVersion: nullable(input.targetVersion),
        action: input.action,
        statusFrom: nullable(input.statusFrom),
        statusTo: nullable(input.statusTo),
        operatorId: nullable(input.operatorId) ?? "system",
        operatorName: nullable(input.operatorName) ?? "系统",
        operatorType: nullable(input.operatorType) ?? "system",
        reason: nullable(input.reason),
        note: nullable(input.note),
        metadata: input.metadata ?? undefined,
        requestId: nullable(input.requestId),
        ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
      },
    });
    return mapPrismaAuditLog(record);
  }

  async listAuditLogs(query: AuditLogListQuery = {}) {
    const { page, pageSize } = parsePagination(query);
    const where = buildWhere(query);
    const [items, total] = await Promise.all([
      this.prisma.hubAuditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.hubAuditLog.count({ where }),
    ]);
    return {
      items: items.map(mapPrismaAuditLog),
      pagination: { page, pageSize, total },
    };
  }
}
