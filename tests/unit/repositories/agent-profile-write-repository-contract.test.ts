import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InMemoryHubRepositoryAdapter } from "@/server/hub/repositories/memory/in-memory-hub-repository-adapter";
import { createAgentProfileContent } from "../agent-profiles/agent-profile-test-fixtures";

describe("Agent Profile write repository contract", () => {
  it("应支持 Agent Profile 创建、更新、发布、废弃和归档", async () => {
    const repository = new InMemoryHubRepositoryAdapter(createHubRepository());
    const content = createAgentProfileContent({ slug: "agent-write-contract" });

    const profile = await repository.createAgentProfile({
      slug: "agent-write-contract",
      name: "Agent Profile 写契约",
      version: "1.0.0",
      scope: "platform",
      status: "draft",
      content,
      checksum: "sha256:agent-write-contract",
      riskLevel: content.riskLevel,
      createdBy: "tester",
    });
    expect(profile).toMatchObject({ slug: "agent-write-contract", status: "draft" });

    const updated = await repository.updateAgentProfileDraft({
      profileId: profile.id,
      name: "Agent Profile 写契约更新",
      ownerTeamId: "team-1",
    });
    expect(updated).toMatchObject({ name: "Agent Profile 写契约更新", status: "draft", ownerTeamId: "team-1" });

    const published = await repository.publishAgentProfile({
      profileId: profile.id,
      checksum: "sha256:published",
      publishedBy: "system",
    });
    expect(published).toMatchObject({ status: "published", checksum: "sha256:published", publishedBy: "system" });

    const deprecated = await repository.deprecateAgentProfile({ profileId: profile.id });
    expect(deprecated.status).toBe("deprecated");
    expect(deprecated.checksum).toBe("sha256:published");

    const archived = await repository.archiveAgentProfile({ profileId: profile.id });
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).toEqual(expect.any(String));
  });
});
