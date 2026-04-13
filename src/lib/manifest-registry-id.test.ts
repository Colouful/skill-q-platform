import { describe, expect, it } from "vitest";
import { toManifestRuleId, toManifestSkillId } from "@/lib/manifest-registry-id";

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
});
