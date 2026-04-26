import { describe, expect, it } from "vitest";
import { ManifestExportService } from "@/server/hub/manifest-export-service";
import { createSeededHubRepository } from "@/server/hub/seed";

describe("Manifest Export 契约", () => {
  it("应保持 br-ai-spec 可消费的 Manifest Export 结构", () => {
    const payload = new ManifestExportService(createSeededHubRepository()).export({
      slug: "frontend-react-vite-standard",
      version: "1.0.0",
    });

    expect(payload.schemaVersion).toBe("1.0.0");
    expect(payload.exportedAt).toEqual(expect.any(String));
    expect(payload.hub).toEqual(expect.objectContaining({ name: "skill-q-platform" }));
    expect(payload.manifest).toEqual(
      expect.objectContaining({
        slug: "frontend-react-vite-standard",
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        installPolicy: expect.objectContaining({
          defaultExecutor: expect.any(String),
          fallbackExecutors: expect.any(Array),
        }),
      }),
    );
    expect(payload.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "role",
          slug: "planner-role",
          version: "1.0.0",
          checksum: expect.stringMatching(/^sha256:/),
          required: true,
          loadWhen: ["planning"],
          contentUrl: expect.stringContaining("/api/hub/assets/planner-role/content"),
        }),
      ]),
    );
    expect(payload.agentProfiles).toEqual([
      expect.objectContaining({
        slug: "diagnostic-agent",
        version: "1.0.0",
        checksum: expect.stringMatching(/^sha256:/),
        contentUrl: expect.stringContaining("/api/hub/agent-profiles/diagnostic-agent/export"),
      }),
    ]);
  });

  it("Manifest Export 资产索引不应内联资产正文", () => {
    const payload = new ManifestExportService(createSeededHubRepository()).export({
      slug: "backend-node-nestjs-standard",
      version: "1.0.0",
    });

    expect(payload.assets[0]).not.toHaveProperty("content");
    expect(payload.agentProfiles[0]).not.toHaveProperty("content");
  });
});
