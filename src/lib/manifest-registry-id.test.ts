import { describe, expect, it } from "vitest";
import { toManifestRoleId, toManifestRuleId, toManifestSkillId } from "@/lib/manifest-registry-id";

describe("manifest registry id helpers", () => {
  it("canonicalizes legacy skill slugs for manifests", () => {
    expect(
      toManifestSkillId({
        slug: "create-api-react",
        name: "React API创建与维护",
        supportedProfiles: ["react"],
      }),
    ).toBe("create-api");
  });

  it("canonicalizes legacy rule slugs for manifests", () => {
    expect(
      toManifestRuleId({
        slug: "react-project-overview",
        name: "React项目概述",
        supportedProfiles: ["react"],
      }),
    ).toBe("project-overview");
  });

  it("canonicalizes legacy common rule slugs for manifests", () => {
    expect(
      toManifestRuleId({
        slug: "api-guidelines",
        name: "API规范",
        supportedProfiles: ["react", "vue"],
      }),
    ).toBe("api-standard");

    expect(
      toManifestRuleId({
        slug: "vue-routing-guidelines",
        name: "Vue路由规范",
        supportedProfiles: ["vue"],
      }),
    ).toBe("route-standard");
  });

  it("prefers explicit manifestId and registryId over slug inference", () => {
    expect(
      toManifestSkillId({
        slug: "create-api-react",
        registryId: "create-api",
        manifestId: "create-api",
      }),
    ).toBe("create-api");

    expect(
      toManifestRuleId({
        slug: "vue-routing-guidelines",
        registryId: "route-standard",
      }),
    ).toBe("route-standard");

    expect(
      toManifestRoleId({
        slug: "task-orchestrator",
        registryId: "task-orchestrator",
        manifestId: "opsx-task-orchestrator",
      }),
    ).toBe("opsx-task-orchestrator");
  });
});
