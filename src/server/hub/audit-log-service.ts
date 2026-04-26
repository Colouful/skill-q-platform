import { randomUUID } from "node:crypto";
import { assertNoSensitivePayload } from "./privacy-guard";
import type { HubAuditAction, HubAuditLog, HubAuditTargetType } from "./audit-log-types";

type AuditInput = {
  targetType: HubAuditTargetType;
  targetId: string;
  action: HubAuditAction;
  operator?: string;
  reason?: string;
  note?: string;
  statusFrom?: string;
  statusTo?: string;
};

const auditLogs: HubAuditLog[] = [];

export class AuditLogService {
  append(input: AuditInput) {
    assertNoSensitivePayload(input);
    const log: HubAuditLog = {
      id: randomUUID(),
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      operator: input.operator ?? "system",
      reason: input.reason,
      note: input.note,
      statusFrom: input.statusFrom,
      statusTo: input.statusTo,
      createdAt: new Date().toISOString(),
    };
    auditLogs.unshift(log);
    return log;
  }

  list(input: URLSearchParams | Record<string, string | undefined> = {}) {
    const get = (key: string) => (input instanceof URLSearchParams ? input.get(key) ?? undefined : input[key]);
    const page = Number(get("page") ?? 1);
    const pageSize = Number(get("pageSize") ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return { items: [], pagination: { page: 1, pageSize: 20, total: 0 } };
    }
    const targetType = get("targetType");
    const targetId = get("targetId");
    const action = get("action");
    const filtered = auditLogs.filter((log) => {
      if (targetType && log.targetType !== targetType) return false;
      if (targetId && log.targetId !== targetId) return false;
      if (action && log.action !== action) return false;
      return true;
    });
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, pageSize, total: filtered.length },
    };
  }

  clear() {
    auditLogs.splice(0, auditLogs.length);
  }
}
