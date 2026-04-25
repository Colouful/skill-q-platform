import { describe, expect, it } from "vitest";
import { buildHubManifestExportPayload } from "@/lib/hub-manifest-export";

describe("hub manifest export", () => {
  it("优先使用已发布版本的 exportSnapshot", () => {
    const payload = buildHubManifestExportPayload({
      manifest: {
        manifestId: "react-standard-manual",
        name: "react-standard-manual",
        displayName: "React 标准研发包",
        description: "desc",
        status: "published",
        techStacks: "[\"react\"]",
        ides: "[\"cursor\"]",
        scenarios: "[\"new-feature\"]",
      },
      version: {
        version: "1.0.0",
        checksum: "manifest-checksum",
        installPolicy: "{\"mode\":\"standard\"}",
        compatibility: "{\"minCliVersion\":\"0.1.11\"}",
        exportSnapshot:
          "{\"contractVersion\":\"1.0.0\",\"manifest\":{\"id\":\"react-standard-manual\",\"version\":\"1.0.0\",\"status\":\"published\"},\"version\":\"1.0.0\",\"assets\":[]}",
        status: "published",
      },
      assets: [],
      assetVersions: [],
    });

    expect(payload.contractVersion).toBe("1.0.0");
    expect(payload.manifest.id).toBe("react-standard-manual");
    expect(payload.version).toBe("1.0.0");
  });

  it("没有 exportSnapshot 时按资产版本生成 CLI 可消费的导出契约", () => {
    const payload = buildHubManifestExportPayload({
      manifest: {
        manifestId: "react-standard-manual",
        name: "react-standard-manual",
        displayName: "React 标准研发包",
        description: "desc",
        status: "published",
        techStacks: "[\"react\"]",
        ides: "[\"cursor\",\"claude-code\"]",
        scenarios: "[\"new-feature\"]",
      },
      version: {
        version: "1.0.0",
        checksum: "manifest-checksum",
        installPolicy: "{\"mode\":\"standard\"}",
        compatibility: "{\"minCliVersion\":\"0.1.11\"}",
        exportSnapshot: "",
        status: "published",
      },
      assets: [
        {
          kind: "skill",
          assetId: "execute-task-manual",
          version: "1.0.0",
          required: 1,
          installPath: ".agents/skills/execute-task-manual/SKILL.md",
          checksum: "asset-checksum",
          sortOrder: 1,
          config: "{}",
        },
      ],
      assetVersions: [
        {
          assetId: "execute-task-manual",
          version: "1.0.0",
          content: "# execute-task\n",
          contentFormat: "markdown",
          checksum: "asset-checksum",
          contentUrl: null,
          riskLevel: "L1",
          status: "published",
        },
      ],
    });

    expect(payload).toMatchObject({
      contractVersion: "1.0.0",
      manifest: {
        id: "react-standard-manual",
        version: "1.0.0",
        status: "published",
        techStacks: ["react"],
        ides: ["cursor", "claude-code"],
      },
      version: "1.0.0",
      checksum: "manifest-checksum",
      installPolicy: { mode: "standard" },
    });
    expect(payload.assets[0]).toMatchObject({
      kind: "skill",
      assetId: "execute-task-manual",
      content: "# execute-task\n",
      riskLevel: "L1",
    });
    expect(payload.files[0]).toMatchObject({
      assetId: "execute-task-manual",
      path: ".agents/skills/execute-task-manual/SKILL.md",
      content: "# execute-task\n",
    });
  });
});
