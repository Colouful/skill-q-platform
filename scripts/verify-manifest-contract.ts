import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { LEGACY_RULE_ID_ALIASES, LEGACY_SKILL_ID_ALIASES } from "../src/lib/hub-registry-contract";

type CliOptions = {
  baseUrl: string;
  scenario: string;
  profiles: string[];
  manifestUrls: string[];
  registryRoot: string;
  strictCanonical: boolean;
};

type RegistryConfig = {
  rules: Set<string>;
  skills: Set<string>;
};

type ManifestPayload = {
  profile?: string;
  rules?: string[];
  skills?: string[];
};

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
const DEFAULT_SCENARIO = "prd-to-delivery";
const DEFAULT_PROFILES = ["vue", "react"];
const DEFAULT_REGISTRY_ROOT = path.resolve(process.cwd(), "../br-ai-spec/.agents/registry");

function printHelp(): void {
  console.log(`
校验 Hub manifest 是否和 ai-spec-auto registry 契约一致。

默认会校验:
  ${DEFAULT_BASE_URL}/api/manifests/scenarios/${DEFAULT_SCENARIO}?profile=vue
  ${DEFAULT_BASE_URL}/api/manifests/scenarios/${DEFAULT_SCENARIO}?profile=react

用法:
  pnpm tsx scripts/verify-manifest-contract.ts
  pnpm tsx scripts/verify-manifest-contract.ts --manifest <url>
  pnpm tsx scripts/verify-manifest-contract.ts --base-url http://localhost:3000 --scenario prd-to-delivery --profiles vue,react

参数:
  --manifest <url>         可重复。显式指定一个或多个 manifest URL
  --base-url <url>         站点根地址，默认 ${DEFAULT_BASE_URL}
  --scenario <slug>        场景 slug，默认 ${DEFAULT_SCENARIO}
  --profiles <a,b>         要验证的 profile 列表，默认 ${DEFAULT_PROFILES.join(",")}
  --registry-root <path>   br-ai-spec 的 .agents/registry 目录
  --strict-canonical       除 unknown 外，legacy alias 也视为失败
  --help, -h               显示帮助
`.trim());
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    baseUrl: DEFAULT_BASE_URL,
    scenario: DEFAULT_SCENARIO,
    profiles: [...DEFAULT_PROFILES],
    manifestUrls: [],
    registryRoot: DEFAULT_REGISTRY_ROOT,
    strictCanonical: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--") {
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--manifest") {
      if (!next) throw new Error("--manifest 缺少 URL");
      opts.manifestUrls.push(next);
      i += 1;
      continue;
    }
    if (arg === "--base-url") {
      opts.baseUrl = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--scenario") {
      opts.scenario = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--profiles") {
      opts.profiles = (next ?? "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (arg === "--registry-root") {
      opts.registryRoot = path.resolve(process.cwd(), next ?? DEFAULT_REGISTRY_ROOT);
      i += 1;
      continue;
    }
    if (arg === "--strict-canonical") {
      opts.strictCanonical = true;
      continue;
    }
    throw new Error(`未知参数: ${arg}`);
  }

  if (!opts.baseUrl && opts.manifestUrls.length === 0) {
    throw new Error("缺少 --base-url 或 --manifest");
  }
  if (!opts.scenario && opts.manifestUrls.length === 0) {
    throw new Error("缺少 --scenario");
  }
  if (opts.manifestUrls.length === 0 && opts.profiles.length === 0) {
    throw new Error("缺少 --profiles");
  }
  return opts;
}

async function loadRegistryConfig(registryRoot: string): Promise<RegistryConfig> {
  const [rulesRaw, skillsRaw] = await Promise.all([
    fs.readFile(path.join(registryRoot, "rules.json"), "utf8"),
    fs.readFile(path.join(registryRoot, "skills.json"), "utf8"),
  ]);
  const rulesJson = JSON.parse(rulesRaw) as { rules?: Record<string, unknown> };
  const skillsJson = JSON.parse(skillsRaw) as { skills?: Record<string, unknown> };
  return {
    rules: new Set(Object.keys(rulesJson.rules ?? {})),
    skills: new Set(Object.keys(skillsJson.skills ?? {})),
  };
}

function buildManifestUrls(opts: CliOptions): string[] {
  if (opts.manifestUrls.length > 0) return opts.manifestUrls;
  return opts.profiles.map(
    (profile) =>
      `${opts.baseUrl.replace(/\/+$/, "")}/api/manifests/scenarios/${encodeURIComponent(
        opts.scenario,
      )}?profile=${encodeURIComponent(profile)}`,
  );
}

function resolveId(
  id: string,
  registrySet: Set<string>,
  aliasTable: Record<string, string>,
): { status: "canonical" | "legacy" | "unknown"; resolved?: string } {
  const trimmed = id.trim();
  if (registrySet.has(trimmed)) {
    return { status: "canonical", resolved: trimmed };
  }
  const alias = aliasTable[trimmed];
  if (alias && registrySet.has(alias)) {
    return { status: "legacy", resolved: alias };
  }
  return { status: "unknown" };
}

async function fetchManifest(url: string): Promise<ManifestPayload> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`拉取失败 ${response.status}: ${url}`);
  }
  return (await response.json()) as ManifestPayload;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const registry = await loadRegistryConfig(opts.registryRoot);
  const urls = buildManifestUrls(opts);

  let hasUnknown = false;
  let hasLegacy = false;

  for (const url of urls) {
    const manifest = await fetchManifest(url);
    const skillResults = (manifest.skills ?? []).map((item) => ({
      id: item,
      ...resolveId(item, registry.skills, LEGACY_SKILL_ID_ALIASES),
    }));
    const ruleResults = (manifest.rules ?? []).map((item) => ({
      id: item,
      ...resolveId(item, registry.rules, LEGACY_RULE_ID_ALIASES),
    }));

    const unknownSkills = skillResults.filter((item) => item.status === "unknown");
    const unknownRules = ruleResults.filter((item) => item.status === "unknown");
    const legacySkills = skillResults.filter((item) => item.status === "legacy");
    const legacyRules = ruleResults.filter((item) => item.status === "legacy");

    hasUnknown ||= unknownSkills.length > 0 || unknownRules.length > 0;
    hasLegacy ||= legacySkills.length > 0 || legacyRules.length > 0;

    console.log(`\n## Manifest ${url}`);
    console.log(`profile=${manifest.profile ?? "(missing)"}`);
    console.log(
      `skills=${(manifest.skills ?? []).length}, rules=${(manifest.rules ?? []).length}, unknown=${unknownSkills.length + unknownRules.length}, legacy=${legacySkills.length + legacyRules.length}`,
    );

    if (legacySkills.length > 0) {
      console.log("legacy skills:");
      for (const item of legacySkills) {
        console.log(`  - ${item.id} -> ${item.resolved}`);
      }
    }
    if (legacyRules.length > 0) {
      console.log("legacy rules:");
      for (const item of legacyRules) {
        console.log(`  - ${item.id} -> ${item.resolved}`);
      }
    }
    if (unknownSkills.length > 0) {
      console.log("unknown skills:");
      for (const item of unknownSkills) {
        console.log(`  - ${item.id}`);
      }
    }
    if (unknownRules.length > 0) {
      console.log("unknown rules:");
      for (const item of unknownRules) {
        console.log(`  - ${item.id}`);
      }
    }
  }

  if (hasUnknown) {
    throw new Error("存在无法在 CLI registry 中解析的 manifest id");
  }
  if (opts.strictCanonical && hasLegacy) {
    throw new Error("存在 legacy alias；strict-canonical 模式下视为失败");
  }

  console.log("\n[ok] manifest contract 验证通过。");
}

main().catch((error) => {
  console.error("verify-manifest-contract failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
