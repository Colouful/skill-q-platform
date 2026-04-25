import { describe, expect, it } from "vitest";
import { ManifestRecommendService } from "@/server/hub/manifest-recommend-service";
import { createSeededHubRepository } from "@/server/hub/seed";

function recommend(primary: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return new ManifestRecommendService(createSeededHubRepository()).recommend({
    projectFacts: [
      {
        packageId: "pkg",
        primary,
        ...extra,
      },
    ],
  }).recommendations[0];
}

describe("ManifestRecommendService", () => {
  it("Next.js 项目推荐 frontend-react-nextjs-standard", () => {
    const result = recommend({
      manifestSlug: "frontend-react-nextjs-standard",
      confidence: 90,
      tags: ["nextjs"],
    });

    expect(result.manifest?.slug).toBe("frontend-react-nextjs-standard");
    expect(result.requiresConfirmation).toBe(false);
  });

  it("Spring Boot 项目推荐 backend-java-springboot-standard", () => {
    const result = recommend({
      confidence: 88,
      frameworks: ["Spring Boot"],
      language: ["Java"],
    });

    expect(result.manifest?.slug).toBe("backend-java-springboot-standard");
  });

  it("NestJS 项目推荐 backend-node-nestjs-standard", () => {
    const result = recommend({
      confidence: 86,
      frameworks: ["NestJS"],
      language: ["TypeScript"],
    });

    expect(result.manifest?.slug).toBe("backend-node-nestjs-standard");
  });

  it("confidence < 60 不推荐", () => {
    const result = recommend({
      confidence: 50,
      frameworks: ["Next.js"],
    });

    expect(result.manifest).toBeNull();
    expect(result.requiresConfirmation).toBe(true);
  });

  it("cli-tool 不推荐业务 Manifest", () => {
    const result = recommend(
      {
        confidence: 95,
        manifestSlug: "frontend-react-nextjs-standard",
      },
      { projectKind: "cli-tool" },
    );

    expect(result.manifest).toBeNull();
    expect(result.reasons[0]).toContain("cli-tool");
  });
});
