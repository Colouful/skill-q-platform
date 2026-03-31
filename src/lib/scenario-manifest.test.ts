import { describe, expect, it } from "vitest";
import { buildInstallManifest, buildScenarioManifest } from "@/lib/scenario-manifest";

describe("scenario-manifest", () => {
  it("normalizes profile and filters unsupported ide presets", () => {
    const manifest = buildInstallManifest({
      profile: "Vue",
      ides: ["Cursor", "Claude", "Trae", "Codex", "Claude"],
      scenarioPackages: ["prd-to-delivery"],
      roles: ["task-orchestrator"],
      skills: ["using-superpowers"],
      rules: ["general-constraints"],
      entryRole: "task-orchestrator",
    });

    expect(manifest.profile).toBe("vue");
    expect(manifest.ides).toEqual(["cursor", "claude", "trae"]);
  });

  it("falls back to default ide when all presets are unsupported", () => {
    const manifest = buildScenarioManifest({
      scenarioSlug: "prd-to-delivery",
      supportedProfiles: ["Vue"],
      recommendedIdes: ["Codex"],
      entryRoleSlug: "task-orchestrator",
      roles: ["task-orchestrator"],
      skills: ["using-superpowers"],
      rules: ["general-constraints"],
    });

    expect(manifest.profile).toBe("vue");
    expect(manifest.ides).toEqual(["default"]);
  });
});
