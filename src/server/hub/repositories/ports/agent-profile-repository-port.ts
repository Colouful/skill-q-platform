import type {
  AgentProfileListQuery,
  ArchiveAgentProfileInput,
  CreateAgentProfileInput,
  DeprecateAgentProfileInput,
  HubAgentProfileDetail,
  HubAgentProfileSummary,
  PaginatedResult,
  PublishAgentProfileInput,
  RejectAgentProfileReviewInput,
  SubmitAgentProfileReviewInput,
  UpdateAgentProfileDraftInput,
} from "../repository-types";

export type AgentProfileRepositoryPort = {
  listAgentProfiles(query?: AgentProfileListQuery): Promise<PaginatedResult<HubAgentProfileSummary>>;
  findAgentProfileById(id: string): Promise<HubAgentProfileDetail | null>;
  findAgentProfileBySlugAndVersion(slug: string, version?: string): Promise<HubAgentProfileDetail | null>;
  createAgentProfile(input: CreateAgentProfileInput): Promise<HubAgentProfileDetail>;
  updateAgentProfileDraft(input: UpdateAgentProfileDraftInput): Promise<HubAgentProfileDetail>;
  submitAgentProfileReview(input: SubmitAgentProfileReviewInput): Promise<HubAgentProfileDetail>;
  rejectAgentProfileReview(input: RejectAgentProfileReviewInput): Promise<HubAgentProfileDetail>;
  publishAgentProfile(input: PublishAgentProfileInput): Promise<HubAgentProfileDetail>;
  deprecateAgentProfile(input: DeprecateAgentProfileInput): Promise<HubAgentProfileDetail>;
  archiveAgentProfile(input: ArchiveAgentProfileInput): Promise<HubAgentProfileDetail>;
};
