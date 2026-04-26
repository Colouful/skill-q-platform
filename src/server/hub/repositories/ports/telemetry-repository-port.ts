import type {
  HubInstallRecordSummary,
  HubRuntimeFeedbackSummary,
  InstallRecordListQuery,
  PaginatedResult,
  RuntimeFeedbackListQuery,
} from "../repository-types";

export type TelemetryRepositoryPort = {
  listInstallRecords(query?: InstallRecordListQuery): Promise<PaginatedResult<HubInstallRecordSummary>>;
  listRuntimeFeedback(query?: RuntimeFeedbackListQuery): Promise<PaginatedResult<HubRuntimeFeedbackSummary>>;
};
