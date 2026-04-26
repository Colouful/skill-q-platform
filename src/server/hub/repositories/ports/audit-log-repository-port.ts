import type {
  AuditLogListQuery,
  HubAuditLogCreateInput,
  HubAuditLogSummary,
  PaginatedResult,
} from "../repository-types";

export type CreateAuditLogInput = HubAuditLogCreateInput;
export type ListAuditLogsQuery = AuditLogListQuery;

export interface AuditLogRepositoryPort {
  listAuditLogs(query?: AuditLogListQuery): Promise<PaginatedResult<HubAuditLogSummary>>;
  createAuditLog(input: HubAuditLogCreateInput): Promise<HubAuditLogSummary>;
}
