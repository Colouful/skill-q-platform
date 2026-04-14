import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma";
import {
  LEGACY_RULE_ID_ALIASES,
  LEGACY_SKILL_ID_ALIASES,
  normalizeRegistryLikeId,
} from "../src/lib/hub-registry-contract";

type CliOptions = {
  apply: boolean;
  registryRoot: string;
  verbose: boolean;
};

type RegistryConfig = {
  skills: Set<string>;
  rules: Set<string>;
};

type RuleRow = {
  id: string;
  slug: string;
  registryId: string | null;
  manifestId: string | null;
  name: string;
  supportedProfiles: unknown;
};

type SkillRow = {
  id: string;
  slug: string;
  registryId: string | null;
  manifestId: string | null;
  name: string;
  supportedProfiles: unknown;
};

type RenamePlan = {
  kind: "rule" | "skill";
  id: string;
  from: string;
  to: string;
  name: string;
};

type IdBackfillPlan = {
  kind: "rule" | "skill";
  id: string;
  slug: string;
  name: string;
  registryId: string;
  manifestId: string;
};

type LinkRepairPlan = {
  sourceRuleId: string;
  sourceSlug: string;
  sourceName: string;
  targetRuleId: string;
  targetSlug: string;
  targetName: string;
  normalizedName: string;
  roleLinks: Array<{ roleId: string; roleSlug: string }>;
  scenarioLinks: Array<{ scenarioPackageId: string; scenarioSlug: string }>;
};

const DEFAULT_REGISTRY_ROOT = path.resolve(process.cwd(), "../br-ai-spec/.agents/registry");

function printHelp(): void {
  console.log(`
将 skill-q-platform 中的 manifest 资产收敛为 ai-spec canonical 契约。

默认行为:
  - dry-run，只打印计划，不改数据库
  - 安全重命名可 1:1 映射到 canonical 的 slug
  - 修复已挂到场景/角色上的自定义 rule 链接（高置信匹配）

用法:
  pnpm tsx scripts/canonicalize-manifest-assets.ts [--apply] [--registry-root <path>] [--verbose]

参数:
  --apply                 实际写入数据库
  --registry-root <path>  指定 br-ai-spec 的 .agents/registry 目录
  --verbose               输出更多扫描信息
  --help, -h              显示帮助
`.trim());
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    apply: false,
    registryRoot: DEFAULT_REGISTRY_ROOT,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--apply") {
      opts.apply = true;
      continue;
    }
    if (arg === "--verbose") {
      opts.verbose = true;
      continue;
    }
    if (arg === "--registry-root") {
      opts.registryRoot = path.resolve(process.cwd(), next ?? DEFAULT_REGISTRY_ROOT);
      i += 1;
      continue;
    }
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

function databaseUrlFromEnv(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  const host = process.env.DB_HOST?.trim();
  const port = process.env.DB_PORT?.trim() || "3306";
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_DATABASE?.trim();
  if (host && user && database) {
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?charset=utf8mb3`;
  }
  throw new Error(
    "DATABASE_URL 未配置（可设置 DATABASE_URL，或 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_DATABASE）",
  );
}

function createPrisma() {
  const raw = databaseUrlFromEnv();
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, "") || undefined;
  const charset = u.searchParams.get("charset") ?? undefined;
  return new PrismaClient({
    adapter: new PrismaMariaDb({
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database,
      ...(charset ? { charset } : {}),
      connectionLimit: 10,
      acquireTimeout: 60_000,
    }),
  });
}

function normalizeName(input: string): string {
  return input
    .trim()
    .replace(/^[\d._-]+/, "")
    .replace(/^[\s:：-]+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function inferSkillCanonicalId(slug: string, registry: RegistryConfig): string | null {
  const trimmed = slug.trim();
  if (registry.skills.has(trimmed)) return trimmed;
  return LEGACY_SKILL_ID_ALIASES[trimmed] ?? null;
}

function inferRuleCanonicalId(slug: string, registry: RegistryConfig): string | null {
  const trimmed = slug.trim();
  if (registry.rules.has(trimmed)) return trimmed;
  return LEGACY_RULE_ID_ALIASES[trimmed] ?? null;
}

function buildIdBackfillPlans<T extends RuleRow | SkillRow>(
  rows: T[],
  kind: "rule" | "skill",
  inferCanonical: (slug: string) => string | null,
): IdBackfillPlan[] {
  const plans: IdBackfillPlan[] = [];
  for (const row of rows) {
    const canonical = inferCanonical(row.slug);
    const explicitId = canonical ?? normalizeRegistryLikeId(row.slug);
    if (!explicitId) continue;
    const currentRegistryId = normalizeRegistryLikeId(row.registryId);
    const currentManifestId = normalizeRegistryLikeId(row.manifestId);
    if (currentRegistryId === explicitId && currentManifestId === explicitId) continue;
    plans.push({
      kind,
      id: row.id,
      slug: row.slug,
      name: row.name,
      registryId: explicitId,
      manifestId: explicitId,
    });
  }
  return plans.sort((a, b) => a.slug.localeCompare(b.slug));
}

function buildRenamePlans<T extends RuleRow | SkillRow>(
  rows: T[],
  kind: "rule" | "skill",
  inferCanonical: (slug: string) => string | null,
): RenamePlan[] {
  const existingSlugs = new Set(rows.map((row) => row.slug));
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const target = inferCanonical(row.slug);
    if (!target || target === row.slug) continue;
    const list = grouped.get(target) ?? [];
    list.push(row);
    grouped.set(target, list);
  }

  const plans: RenamePlan[] = [];
  for (const [target, candidates] of grouped.entries()) {
    if (existingSlugs.has(target)) continue;
    if (candidates.length !== 1) continue;
    const [row] = candidates;
    plans.push({
      kind,
      id: row.id,
      from: row.slug,
      to: target,
      name: row.name,
    });
  }

  return plans.sort((a, b) => a.from.localeCompare(b.from));
}

async function buildRuleLinkRepairPlans(
  prisma: PrismaClient,
  rules: RuleRow[],
  registry: RegistryConfig,
  ruleRenamePlans: RenamePlan[],
): Promise<LinkRepairPlan[]> {
  const plannedRuleSlugById = new Map(ruleRenamePlans.map((plan) => [plan.id, plan.to]));
  const registryReadyRules = new Map<string, RuleRow>();
  for (const rule of rules) {
    const effectiveSlug = plannedRuleSlugById.get(rule.id) ?? rule.slug;
    if (registry.rules.has(effectiveSlug)) {
      registryReadyRules.set(rule.id, { ...rule, slug: effectiveSlug });
    }
  }

  const registryReadyByName = new Map<string, RuleRow[]>();
  for (const rule of registryReadyRules.values()) {
    const key = normalizeName(rule.name);
    const list = registryReadyByName.get(key) ?? [];
    list.push(rule);
    registryReadyByName.set(key, list);
  }

  const unresolvedRules = rules.filter((rule) => {
    const effectiveSlug = plannedRuleSlugById.get(rule.id) ?? rule.slug;
    return !registry.rules.has(effectiveSlug);
  });

  const plans: LinkRepairPlan[] = [];
  for (const rule of unresolvedRules) {
    const links = await prisma.rule.findUnique({
      where: { id: rule.id },
      select: {
        roleLinks: {
          select: {
            roleId: true,
            role: { select: { slug: true } },
          },
        },
        scenarioLinks: {
          select: {
            scenarioPackageId: true,
            scenarioPackage: { select: { slug: true } },
          },
        },
      },
    });
    const roleLinks =
      links?.roleLinks.map((item) => ({
        roleId: item.roleId,
        roleSlug: item.role.slug,
      })) ?? [];
    const scenarioLinks =
      links?.scenarioLinks.map((item) => ({
        scenarioPackageId: item.scenarioPackageId,
        scenarioSlug: item.scenarioPackage.slug,
      })) ?? [];

    if (roleLinks.length === 0 && scenarioLinks.length === 0) continue;

    const normalized = normalizeName(rule.name);
    const candidates = (registryReadyByName.get(normalized) ?? []).filter(
      (candidate) => candidate.id !== rule.id,
    );
    if (candidates.length !== 1) continue;

    const [target] = candidates;
    plans.push({
      sourceRuleId: rule.id,
      sourceSlug: rule.slug,
      sourceName: rule.name,
      targetRuleId: target.id,
      targetSlug: target.slug,
      targetName: target.name,
      normalizedName: normalized,
      roleLinks,
      scenarioLinks,
    });
  }

  return plans.sort((a, b) => a.sourceSlug.localeCompare(b.sourceSlug));
}

async function applyRuleLinkRepairPlan(
  prisma: PrismaClient,
  plan: LinkRepairPlan,
): Promise<void> {
  for (const link of plan.roleLinks) {
    const existing = await prisma.roleRuleLink.findFirst({
      where: {
        roleId: link.roleId,
        ruleId: plan.targetRuleId,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.roleRuleLink.deleteMany({
        where: {
          roleId: link.roleId,
          ruleId: plan.sourceRuleId,
        },
      });
      continue;
    }
    await prisma.roleRuleLink.updateMany({
      where: {
        roleId: link.roleId,
        ruleId: plan.sourceRuleId,
      },
      data: {
        ruleId: plan.targetRuleId,
      },
    });
  }

  for (const link of plan.scenarioLinks) {
    const existing = await prisma.scenarioPackageRule.findFirst({
      where: {
        scenarioPackageId: link.scenarioPackageId,
        ruleId: plan.targetRuleId,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.scenarioPackageRule.deleteMany({
        where: {
          scenarioPackageId: link.scenarioPackageId,
          ruleId: plan.sourceRuleId,
        },
      });
      continue;
    }
    await prisma.scenarioPackageRule.updateMany({
      where: {
        scenarioPackageId: link.scenarioPackageId,
        ruleId: plan.sourceRuleId,
      },
      data: {
        ruleId: plan.targetRuleId,
      },
    });
  }
}

function printSection(title: string, lines: string[]): void {
  console.log(`\n## ${title}`);
  if (lines.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const line of lines) {
    console.log(`  - ${line}`);
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const registry = await loadRegistryConfig(opts.registryRoot);
  const prisma = createPrisma();

  try {
    const [rules, skills] = await Promise.all([
      prisma.rule.findMany({
        select: { id: true, slug: true, registryId: true, manifestId: true, name: true, supportedProfiles: true },
        orderBy: { slug: "asc" },
      }),
      prisma.skill.findMany({
        select: { id: true, slug: true, registryId: true, manifestId: true, name: true, supportedProfiles: true },
        orderBy: { slug: "asc" },
      }),
    ]);

    const ruleRenamePlans = buildRenamePlans(rules, "rule", (slug) =>
      inferRuleCanonicalId(slug, registry),
    );
    const skillRenamePlans = buildRenamePlans(skills, "skill", (slug) =>
      inferSkillCanonicalId(slug, registry),
    );
    const ruleIdBackfillPlans = buildIdBackfillPlans(rules, "rule", (slug) =>
      inferRuleCanonicalId(slug, registry),
    );
    const skillIdBackfillPlans = buildIdBackfillPlans(skills, "skill", (slug) =>
      inferSkillCanonicalId(slug, registry),
    );
    const ruleLinkRepairPlans = await buildRuleLinkRepairPlans(
      prisma,
      rules,
      registry,
      ruleRenamePlans,
    );

    const unresolvedLinkedRules = [];
    for (const rule of rules) {
      const effectiveCanonical =
        ruleRenamePlans.find((plan) => plan.id === rule.id)?.to ??
        inferRuleCanonicalId(rule.slug, registry);
      if (effectiveCanonical && registry.rules.has(effectiveCanonical)) continue;
      const counts = await prisma.rule.findUnique({
        where: { id: rule.id },
        select: {
          _count: { select: { roleLinks: true, scenarioLinks: true } },
        },
      });
      if (!counts) continue;
      if (counts._count.roleLinks === 0 && counts._count.scenarioLinks === 0) continue;
      const willRepair = ruleLinkRepairPlans.some((plan) => plan.sourceRuleId === rule.id);
      if (!willRepair) {
        unresolvedLinkedRules.push(
          `${rule.slug} (${rule.name}) roleLinks=${counts._count.roleLinks}, scenarioLinks=${counts._count.scenarioLinks}`,
        );
      }
    }

    console.log(
      `[${opts.apply ? "apply" : "dry-run"}] registry rules=${registry.rules.size}, skills=${registry.skills.size}`,
    );
    printSection(
      "可安全重命名的 Rule",
      ruleRenamePlans.map((plan) => `${plan.from} -> ${plan.to} (${plan.name})`),
    );
    printSection(
      "可安全重命名的 Skill",
      skillRenamePlans.map((plan) => `${plan.from} -> ${plan.to} (${plan.name})`),
    );
    printSection(
      "可回填的 Rule registryId/manifestId",
      ruleIdBackfillPlans.map(
        (plan) => `${plan.slug} -> registryId=${plan.registryId}, manifestId=${plan.manifestId}`,
      ),
    );
    printSection(
      "可回填的 Skill registryId/manifestId",
      skillIdBackfillPlans.map(
        (plan) => `${plan.slug} -> registryId=${plan.registryId}, manifestId=${plan.manifestId}`,
      ),
    );
    printSection(
      "可高置信修复的自定义 Rule 链接",
      ruleLinkRepairPlans.map(
        (plan) =>
          `${plan.sourceSlug} -> ${plan.targetSlug} | roles=${plan.roleLinks
            .map((item) => item.roleSlug)
            .join(",") || "-"} | scenarios=${plan.scenarioLinks
            .map((item) => item.scenarioSlug)
            .join(",") || "-"}`,
      ),
    );
    printSection("仍需人工处理的非 canonical Rule 链接", unresolvedLinkedRules);

    if (opts.verbose) {
      const unresolvedSkills = skills
        .filter((skill) => !inferSkillCanonicalId(skill.slug, registry))
        .map((skill) => skill.slug);
      printSection("非 canonical Skill（仅报告）", unresolvedSkills);
    }

    if (!opts.apply) {
      console.log("\n[dry-run] 未写入数据库。确认输出无误后可加 --apply。");
      return;
    }

    for (const plan of ruleRenamePlans) {
      await prisma.rule.update({
        where: { id: plan.id },
        data: { slug: plan.to },
      });
    }
    for (const plan of skillRenamePlans) {
      await prisma.skill.update({
        where: { id: plan.id },
        data: { slug: plan.to },
      });
    }
    for (const plan of ruleIdBackfillPlans) {
      await prisma.rule.update({
        where: { id: plan.id },
        data: {
          registryId: plan.registryId,
          manifestId: plan.manifestId,
        },
      });
    }
    for (const plan of skillIdBackfillPlans) {
      await prisma.skill.update({
        where: { id: plan.id },
        data: {
          registryId: plan.registryId,
          manifestId: plan.manifestId,
        },
      });
    }
    for (const plan of ruleLinkRepairPlans) {
      await applyRuleLinkRepairPlan(prisma, plan);
    }

    console.log("\n[apply] 数据库更新完成。");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("canonicalize-manifest-assets failed:", error);
  process.exit(1);
});
