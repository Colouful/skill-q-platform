import { describe, expect, it } from "vitest";
import {
  buildSupplementSlugResolver,
  resolveRequestedCanonicalSlugs,
} from "@/lib/install-supplement";
import {
  toManifestRoleId,
  toManifestRuleId,
  toManifestSkillId,
} from "@/lib/manifest-registry-id";

describe("install supplement helpers", () => {
  it("prefers manifestId, then registryId, then canonical alias, then slug for skills", () => {
    const resolveSkill = buildSupplementSlugResolver(
      [
        {
          slug: "create-api-react",
          name: "React API",
          supportedProfiles: ["react"],
          registryId: "create-api",
          manifestId: "create-api",
        },
      ],
      toManifestSkillId,
    );

    expect(resolveSkill("create-api")?.slug).toBe("create-api-react");
    expect(resolveSkill("create-api-react")?.slug).toBe("create-api-react");
  });

  it("falls back to canonical rule alias resolution for legacy slug-backed rules", () => {
    const resolveRule = buildSupplementSlugResolver(
      [
        {
          slug: "react-project-overview",
          name: "React 项目概述",
          supportedProfiles: ["react"],
          registryId: null,
          manifestId: null,
        },
      ],
      toManifestRuleId,
    );

    expect(resolveRule("project-overview")?.slug).toBe("react-project-overview");
    expect(resolveRule("react-project-overview")?.slug).toBe("react-project-overview");
  });

  it("uses manifestId and registryId precedence for roles", () => {
    const resolveRole = buildSupplementSlugResolver(
      [
        {
          slug: "task-orchestrator",
          registryId: "task-orchestrator",
          manifestId: "opsx-task-orchestrator",
        },
      ],
      toManifestRoleId,
    );

    expect(resolveRole("opsx-task-orchestrator")?.slug).toBe("task-orchestrator");
    expect(resolveRole("task-orchestrator")?.slug).toBe("task-orchestrator");
  });

  it("returns ordered missing ids when canonical assets are absent", () => {
    const resolveRole = buildSupplementSlugResolver(
      [{ slug: "task-orchestrator", registryId: "task-orchestrator", manifestId: null }],
      toManifestRoleId,
    );

    const resolved = resolveRequestedCanonicalSlugs(
      ["task-orchestrator", "missing-role"],
      resolveRole,
    );

    expect(resolved.slugs).toEqual(["task-orchestrator"]);
    expect(resolved.missing).toEqual(["missing-role"]);
  });
});
