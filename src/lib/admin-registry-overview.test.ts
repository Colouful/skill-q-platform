import { describe, expect, it } from "vitest";
import {
  buildRegistryOverviewSection,
  getRegistryOverviewStatus,
  getRegistryOverviewStatusLabel,
} from "@/lib/admin-registry-overview";

describe("admin registry overview helpers", () => {
  it("classifies registry field completeness", () => {
    expect(getRegistryOverviewStatus(null, null)).toBe("missing-registry");
    expect(getRegistryOverviewStatus("task-orchestrator", null)).toBe("missing-manifest");
    expect(getRegistryOverviewStatus("task-orchestrator", "task-orchestrator-v2")).toBe("mismatch");
    expect(getRegistryOverviewStatus("task-orchestrator", "task-orchestrator")).toBe("ready");
  });

  it("returns readable status labels", () => {
    expect(getRegistryOverviewStatusLabel("ready")).toBe("已补齐");
    expect(getRegistryOverviewStatusLabel("missing-registry")).toBe("缺 registryId");
    expect(getRegistryOverviewStatusLabel("missing-manifest")).toBe("缺 manifestId");
    expect(getRegistryOverviewStatusLabel("mismatch")).toBe("协议字段不一致");
  });

  it("builds summaries and role edit links", () => {
    const section = buildRegistryOverviewSection("role", "Role 协议完整度", [
      {
        id: "1",
        name: "任务主代理",
        slug: "task-orchestrator",
        registryId: "task-orchestrator",
        manifestId: "task-orchestrator",
        supportedProfiles: ["vue", "react"],
      },
      {
        id: "2",
        name: "归档专家",
        slug: "archive-change",
        registryId: "archive-change",
        manifestId: null,
        supportedProfiles: ["vue"],
      },
      {
        id: "3",
        name: "需求专家",
        slug: "requirement-analyst",
        registryId: "requirement-analyst",
        manifestId: "req-analyst",
        supportedProfiles: [],
      },
    ]);

    expect(section.summary.total).toBe(3);
    expect(section.summary.canonicalReady).toBe(1);
    expect(section.summary.missingManifestId).toBe(1);
    expect(section.summary.mismatch).toBe(1);
    expect(section.items[0]?.editHref).toBe("/admin/roles?edit=task-orchestrator");
    expect(section.items[1]?.statusLabel).toBe("缺 manifestId");
    expect(section.items[2]?.statusLabel).toBe("协议字段不一致");
  });
});
