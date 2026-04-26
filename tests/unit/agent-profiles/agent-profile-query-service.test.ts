import { describe, expect, it } from "vitest";
import { AgentProfileGovernanceService } from "@/server/hub/agent-profile-governance-service";
import { AgentProfileQueryService } from "@/server/hub/agent-profile-query-service";
import { createHubRepository } from "@/server/hub/repository";
import { createAgentProfileContent } from "./agent-profile-test-fixtures";

describe("AgentProfileQueryService", () => {
  it("应支持分页、keyword、status 和 riskLevel 筛选", async () => {
    const repo = createHubRepository();
    const governance = new AgentProfileGovernanceService(repo);
    governance.createDraft({
      slug: "query-low-agent",
      name: "Query Low",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "query-low-agent", name: "Query Low", riskLevel: "low" }),
    });
    const high = governance.createDraft({
      slug: "query-high-agent",
      name: "Query High",
      version: "1.0.0",
      content: createAgentProfileContent({ slug: "query-high-agent", name: "Query High", riskLevel: "high" }),
    });
    governance.publish(String(high.profile.id), {});
    const service = new AgentProfileQueryService(repo);

    expect((await service.list(new URLSearchParams("page=1&pageSize=1"))).pagination.total).toBe(2);
    expect((await service.list(new URLSearchParams("keyword=high"))).items).toHaveLength(1);
    expect((await service.list(new URLSearchParams("status=published"))).items[0].slug).toBe("query-high-agent");
    expect((await service.list(new URLSearchParams("riskLevel=low"))).items[0].slug).toBe("query-low-agent");
  });
});
