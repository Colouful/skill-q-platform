import type { HubRepository } from "./repository";

const MANIFEST_BY_DETECTOR: Record<string, string> = {
  nextjs: "frontend-react-nextjs-standard",
  "react-vite": "frontend-react-vite-standard",
  "react-webpack": "frontend-react-standard",
  "vue-vite": "frontend-vue-vite-standard",
  springboot: "backend-java-springboot-standard",
  springmvc: "backend-java-springmvc-legacy-standard",
  springcloud: "backend-java-springcloud-standard",
  fastapi: "backend-python-fastapi-standard",
  go: "backend-go-standard",
  nestjs: "backend-node-nestjs-standard",
};

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function inferManifestSlug(primary: Record<string, unknown>) {
  const explicit = normalize(primary.manifestSlug);
  if (explicit) return explicit;
  const tags = Array.isArray(primary.tags) ? primary.tags.map(normalize) : [];
  for (const tag of tags) {
    if (MANIFEST_BY_DETECTOR[tag]) return MANIFEST_BY_DETECTOR[tag];
  }
  const frameworks = Array.isArray(primary.frameworks) ? primary.frameworks.map(normalize) : [];
  if (frameworks.includes("next.js") || frameworks.includes("nextjs")) return MANIFEST_BY_DETECTOR.nextjs;
  if (frameworks.includes("react") && frameworks.includes("vite")) return MANIFEST_BY_DETECTOR["react-vite"];
  if (frameworks.includes("react") && frameworks.includes("webpack")) return MANIFEST_BY_DETECTOR["react-webpack"];
  if (frameworks.includes("vue") && frameworks.includes("vite")) return MANIFEST_BY_DETECTOR["vue-vite"];
  if (frameworks.includes("spring boot")) return MANIFEST_BY_DETECTOR.springboot;
  if (frameworks.includes("spring mvc")) return MANIFEST_BY_DETECTOR.springmvc;
  if (frameworks.includes("spring cloud")) return MANIFEST_BY_DETECTOR.springcloud;
  if (frameworks.includes("fastapi")) return MANIFEST_BY_DETECTOR.fastapi;
  if (frameworks.includes("nestjs") || frameworks.includes("nest.js")) return MANIFEST_BY_DETECTOR.nestjs;
  const language = Array.isArray(primary.language) ? primary.language.map(normalize) : [];
  if (language.includes("go")) return MANIFEST_BY_DETECTOR.go;
  return "";
}

export class ManifestRecommendService {
  constructor(private readonly repo: HubRepository) {}

  recommend(input: { workspace?: unknown; projectFacts?: Array<Record<string, unknown>> }) {
    const projectFacts = Array.isArray(input.projectFacts) ? input.projectFacts : [];
    const recommendations = projectFacts.map((fact) => {
      const primary = fact.primary && typeof fact.primary === "object" ? (fact.primary as Record<string, unknown>) : null;
      const projectKind = normalize(fact.projectKind || primary?.projectKind);
      const packageId = String(fact.packageId ?? "");
      if (!primary) {
        return {
          packageId,
          manifest: null,
          score: 0,
          reasons: ["primary 为空，未识别到明确技术栈，不自动推荐 Manifest。"],
          requiresConfirmation: true,
        };
      }
      const confidence = Number(primary.confidence ?? 0);
      if (projectKind === "cli-tool" || projectKind === "library") {
        return {
          packageId,
          manifest: null,
          score: confidence,
          reasons: [`当前项目类型为 ${projectKind}，不自动推荐业务 Manifest。`],
          requiresConfirmation: true,
        };
      }
      if (confidence < 60) {
        return {
          packageId,
          manifest: null,
          score: confidence,
          reasons: [`confidence=${confidence} 低于 60，不自动推荐 Manifest。`],
          requiresConfirmation: true,
        };
      }
      const manifestSlug = inferManifestSlug(primary);
      const manifest = manifestSlug
        ? this.repo.manifests.find((item) => item.slug === manifestSlug && item.status === "published")
        : null;
      if (!manifest) {
        return {
          packageId,
          manifest: null,
          score: confidence,
          reasons: ["没有匹配到已发布 Manifest。"],
          requiresConfirmation: true,
        };
      }
      const version = this.repo.manifestVersions.find(
        (item) => item.manifestId === manifest.id && item.status === "published",
      );
      return {
        packageId,
        manifest: {
          slug: manifest.slug,
          version: version?.version ?? "1.0.0",
        },
        score: confidence,
        reasons: [`根据 primary detector 推荐 ${manifest.slug}。`, `confidence=${confidence}。`],
        requiresConfirmation: confidence < 80,
      };
    });
    return { recommendations };
  }
}
