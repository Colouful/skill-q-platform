import { describe, expect, it } from "vitest";
import { findScenarioProfileConflict } from "@/lib/scenario-profile-validation";

describe("scenario profile validation", () => {
  it("requires scenarios to declare supported profiles", () => {
    expect(findScenarioProfileConflict({ scenarioProfiles: [], assets: [] })).toContain(
      "supportedProfiles 不能为空",
    );
  });

  it("rejects assets that do not intersect scenario profiles", () => {
    const message = findScenarioProfileConflict({
      scenarioProfiles: ["vue"],
      assets: [
        {
          kind: "Skill",
          slug: "create-api-react",
          name: "React API创建与维护",
          supportedProfiles: ["react"],
        },
      ],
    });

    expect(message).toContain("React API创建与维护");
    expect(message).toContain("vue");
    expect(message).toContain("react");
  });

  it("allows assets whose profiles intersect with the scenario", () => {
    expect(
      findScenarioProfileConflict({
        scenarioProfiles: ["vue"],
        assets: [
          {
            kind: "Rule",
            slug: "project-overview",
            name: "项目概述",
            supportedProfiles: ["vue"],
          },
        ],
      }),
    ).toBeNull();
  });
});
