import "dotenv/config";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { sanitizeCatalogSlug } from "../src/lib/catalog-slug";
import { takeHeadingAndFirstParagraph } from "../src/lib/first-paragraph";
import { metaToRuleHints, parseSkillMd } from "../src/lib/skill-md-parse";

type CliOptions = {
  source: string;
  api: string;
  category?: string;
  author?: string;
  dryRun: boolean;
  delayMs: number;
  bearer?: string;
  hubActor?: string;
  hubAdminSecret?: string;
  only: string[];
};

type FileEntry = {
  name: string;
  path: string;
  content: string;
};

type RulePackage = {
  sourcePath: string;
  relativePath: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  author: string;
  categorySlug: string;
  tags: string[];
  files: FileEntry[];
};

type RulePreset = {
  name: string;
  slug: string;
  tags: string[];
  categorySlug?: string;
};

const DEFAULT_API = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
const DEFAULT_CATEGORY = "rule-sets";
const DEFAULT_DELAY_MS = 2200;

const NOISE_FILE_NAMES = new Set([".DS_Store", "Thumbs.db"]);
const SKIP_DIR_NAMES = new Set([
  ".git",
  ".idea",
  ".next",
  ".turbo",
  ".vscode",
  "__MACOSX",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const RULE_PRESETS: Record<string, RulePreset> = {
  "common/02-编码规范.md": {
    name: "编码规范",
    slug: "coding-guidelines",
    tags: ["TypeScript", "JavaScript", "命名规范", "代码实现"],
  },
  "common/05-API规范.md": {
    name: "API规范",
    slug: "api-guidelines",
    tags: ["API", "接口规范", "前后端协作", "代码实现"],
  },
  "common/08-通用约束.md": {
    name: "通用约束",
    slug: "general-constraints",
    tags: ["通用约束", "工程规范", "ai-spec", "协作"],
  },
  "common/10-文档规范.md": {
    name: "文档规范",
    slug: "documentation-guidelines",
    tags: ["文档规范", "技术写作", "协作", "ai-spec"],
  },
  "common/11-测试规范.md": {
    name: "测试规范",
    slug: "testing-guidelines",
    tags: ["测试", "Vitest", "质量保障", "代码实现"],
  },
  "common/12-Superpowers执行规范.md": {
    name: "Superpowers执行规范",
    slug: "superpowers-execution-guidelines",
    tags: ["Superpowers", "任务执行", "工作流", "ai-spec"],
    categorySlug: "workflow-templates",
  },
  "common/13-代码格式化与检查.md": {
    name: "代码格式化与检查",
    slug: "code-formatting-and-checks",
    tags: ["ESLint", "Prettier", "代码检查", "工程规范"],
  },
  "common/14-审计汇报规范.md": {
    name: "审计汇报规范",
    slug: "audit-reporting-guidelines",
    tags: ["审计汇报", "质量保障", "工作流", "ai-spec"],
  },
  "profiles/react/01-项目概述.md": {
    name: "React项目概述",
    slug: "react-project-overview",
    tags: ["React", "项目概述", "项目初始化", "ai-spec"],
  },
  "profiles/react/03-项目结构.md": {
    name: "React项目结构",
    slug: "react-project-structure",
    tags: ["React", "项目结构", "工程规范", "ai-spec"],
  },
  "profiles/react/04-组件规范.md": {
    name: "React组件规范",
    slug: "react-component-guidelines",
    tags: ["React", "组件开发", "Hooks", "代码实现"],
  },
  "profiles/react/06-路由规范.md": {
    name: "React路由规范",
    slug: "react-routing-guidelines",
    tags: ["React", "路由", "页面开发", "代码实现"],
    categorySlug: "routing-rules",
  },
  "profiles/react/07-状态管理.md": {
    name: "React状态管理规范",
    slug: "react-state-management",
    tags: ["React", "状态管理", "Redux", "Zustand"],
  },
  "profiles/react/09-样式规范.md": {
    name: "React样式规范",
    slug: "react-style-guidelines",
    tags: ["React", "CSS", "样式规范", "主题变量"],
  },
  "profiles/vue/01-项目概述.md": {
    name: "Vue项目概述",
    slug: "vue-project-overview",
    tags: ["Vue", "项目概述", "项目初始化", "ai-spec"],
  },
  "profiles/vue/03-项目结构.md": {
    name: "Vue项目结构",
    slug: "vue-project-structure",
    tags: ["Vue", "项目结构", "工程规范", "ai-spec"],
  },
  "profiles/vue/04-组件规范.md": {
    name: "Vue组件规范",
    slug: "vue-component-guidelines",
    tags: ["Vue", "组件开发", "SFC", "代码实现"],
  },
  "profiles/vue/06-路由规范.md": {
    name: "Vue路由规范",
    slug: "vue-routing-guidelines",
    tags: ["Vue", "路由", "页面开发", "代码实现"],
    categorySlug: "routing-rules",
  },
  "profiles/vue/07-状态管理.md": {
    name: "Vue状态管理规范",
    slug: "vue-state-management",
    tags: ["Vue", "状态管理", "Pinia", "代码实现"],
  },
  "profiles/vue/09-样式规范.md": {
    name: "Vue样式规范",
    slug: "vue-style-guidelines",
    tags: ["Vue", "CSS", "样式规范", "主题变量"],
  },
};

function printHelp(): void {
  console.log(`
从本地目录读取 Rule Markdown，并调用当前站点 /api/rules 导入。

用法:
  npm run import:rules-local -- --source <目录>

常用参数:
  --source <目录>            必填。单个 Rule markdown 文件，或包含多个 Rule 的根目录
  --api <地址>              站点地址，默认 ${DEFAULT_API}
  --category <slug>         强制所有 Rule 使用同一分类；默认按文件推断，兜底 ${DEFAULT_CATEGORY}
  --author <作者>           创建时使用的 author；默认取当前系统用户
  --only <关键字>           仅导入名称、slug 或路径中包含关键字的 Rule，可重复传
  --dry-run                 只扫描并打印，不发请求
  --delay-ms <毫秒>         每次创建后的等待，默认 ${DEFAULT_DELAY_MS}ms，用于避开 30/min 限流

认证相关:
  --bearer <API_KEY>        站点开启“上传需登录”时使用 Agent API Key
  --hub-actor <昵称>        站点开启 HUB_AUTH 时使用；默认跟随最终 author
  --hub-admin-secret <值>   仅用于绕过 HUB_AUTH 作者校验；不能替代登录态

示例:
  npm run import:rules-local -- \\
    --source /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/.agents/rules \\
    --author lizhenwei \\
    --dry-run

  npm run import:rules-local -- \\
    --source /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/.agents/rules \\
    --author lizhenwei \\
    --api http://localhost:3000 \\
    --bearer sk_xxx
`.trim());
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    source: "",
    api: DEFAULT_API,
    category: process.env.RULE_IMPORT_CATEGORY?.trim() || undefined,
    author: process.env.RULE_IMPORT_AUTHOR?.trim() || undefined,
    dryRun: false,
    delayMs: DEFAULT_DELAY_MS,
    bearer: process.env.HUB_AGENT_API_KEY?.trim() || undefined,
    hubActor: process.env.HUB_ACTOR?.trim() || undefined,
    hubAdminSecret: process.env.HUB_ADMIN_SECRET?.trim() || undefined,
    only: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--source") {
      opts.source = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--api") {
      opts.api = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--category") {
      opts.category = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--author") {
      opts.author = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--delay-ms") {
      opts.delayMs = Number(next ?? DEFAULT_DELAY_MS);
      i += 1;
      continue;
    }
    if (arg === "--bearer") {
      opts.bearer = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--hub-actor") {
      opts.hubActor = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--hub-admin-secret") {
      opts.hubAdminSecret = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--only") {
      if (next) opts.only.push(next);
      i += 1;
      continue;
    }
    throw new Error(`未知参数: ${arg}`);
  }

  if (!opts.source) {
    throw new Error("缺少 --source");
  }
  if (!opts.api) {
    throw new Error("缺少 --api");
  }
  if (opts.category !== undefined && !opts.category.trim()) {
    throw new Error("--category 不能为空字符串");
  }
  if (!Number.isFinite(opts.delayMs) || opts.delayMs < 0) {
    throw new Error("--delay-ms 必须是大于等于 0 的数字");
  }

  return opts;
}

function normalizeRelativePath(target: string): string {
  return target.split(path.sep).join("/");
}

function shouldSkipFileName(name: string): boolean {
  if (NOISE_FILE_NAMES.has(name)) return true;
  if (name.toLowerCase() === "readme.md") return true;
  if (name.startsWith(".") && name.toLowerCase() !== ".env.example") return true;
  return false;
}

async function discoverRuleFiles(source: string): Promise<string[]> {
  const absoluteSource = path.resolve(source);
  const stat = await fs.stat(absoluteSource).catch(() => null);
  if (!stat) throw new Error(`目录不存在: ${absoluteSource}`);

  if (stat.isFile()) {
    if (path.extname(absoluteSource).toLowerCase() !== ".md") {
      throw new Error(`--source 必须是 Markdown 文件或目录: ${absoluteSource}`);
    }
    return [absoluteSource];
  }

  if (!stat.isDirectory()) {
    throw new Error(`--source 必须是 Markdown 文件或目录: ${absoluteSource}`);
  }

  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (shouldSkipFileName(entry.name)) continue;
      if (path.extname(entry.name).toLowerCase() !== ".md") continue;
      files.push(fullPath);
    }
  }

  await walk(absoluteSource);
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function findFirstHeading(body: string): string {
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*$/);
    if (match) return match[1].trim();
  }
  return "";
}

function stripMarkdownHeadingMarks(body: string): string {
  return body.replace(/^\s{0,3}#{1,6}\s+/gm, "").trim();
}

function normalizeSummary(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function trimNumericPrefix(name: string): string {
  return name.replace(/^\d+[-_.\s]*/, "").trim();
}

function frameworkPrefix(relativePath: string): string {
  if (relativePath.startsWith("profiles/react/")) return "React";
  if (relativePath.startsWith("profiles/vue/")) return "Vue";
  return "";
}

function fallbackNameFromRelativePath(relativePath: string): string {
  const stem = path.basename(relativePath, path.extname(relativePath));
  return trimNumericPrefix(stem) || stem;
}

function toSummaryDescription(body: string, fallback: string): string {
  const summary = normalizeSummary(stripMarkdownHeadingMarks(takeHeadingAndFirstParagraph(body)));
  return summary.slice(0, 255) || fallback;
}

function stableFallbackSlug(relativePath: string): string {
  const asciiStem = sanitizeCatalogSlug(
    relativePath
      .toLowerCase()
      .replace(/\.md$/i, "")
      .replace(/[^a-z0-9/._-]+/g, "-")
      .replace(/\//g, "-"),
  );
  if (asciiStem) return asciiStem;
  const hash = createHash("sha1").update(relativePath).digest("hex").slice(0, 8);
  return `rule-${hash}`;
}

function dedupeTags(tags: string[]): string[] {
  const unique: string[] = [];
  for (const tag of tags.map((item) => item.trim()).filter(Boolean)) {
    if (!unique.includes(tag)) unique.push(tag);
  }
  return unique;
}

function inferTags(relativePath: string, name: string, description: string): string[] {
  const tags: string[] = [];
  const prefix = frameworkPrefix(relativePath);
  const target = `${name} ${description} ${relativePath}`;

  if (prefix) tags.push(prefix);
  if (/superpowers/i.test(target)) tags.push("Superpowers", "工作流");
  if (/api/i.test(target)) tags.push("API", "接口规范");
  if (/组件/.test(target)) tags.push("组件开发");
  if (/路由/.test(target)) tags.push("路由", "页面开发");
  if (/状态管理/.test(target)) tags.push("状态管理");
  if (/样式/.test(target)) tags.push("CSS", "样式规范");
  if (/测试/.test(target)) tags.push("测试", "质量保障");
  if (/文档/.test(target)) tags.push("文档规范", "技术写作");
  if (/编码/.test(target)) tags.push("TypeScript", "代码实现");
  if (/审计/.test(target)) tags.push("审计汇报");
  if (/通用约束/.test(target)) tags.push("通用约束", "工程规范");
  if (/项目概述/.test(target)) tags.push("项目概述", "项目初始化");
  if (/项目结构/.test(target)) tags.push("项目结构", "工程规范");
  if (/ai-spec/i.test(target) || !prefix) tags.push("ai-spec");

  return dedupeTags(tags).slice(0, 4);
}

function inferCategory(relativePath: string, opts: CliOptions, preset?: RulePreset): string {
  if (opts.category?.trim()) return opts.category.trim();
  if (preset?.categorySlug) return preset.categorySlug;
  if (relativePath.includes("路由规范")) return "routing-rules";
  if (relativePath.toLowerCase().includes("superpowers")) return "workflow-templates";
  return DEFAULT_CATEGORY;
}

async function buildRulePackage(
  filePath: string,
  sourceRoot: string,
  explicitAuthor: string | undefined,
  opts: CliOptions,
): Promise<RulePackage> {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = parseSkillMd(content);
  const hints = metaToRuleHints(parsed.meta);
  const relativePath =
    normalizeRelativePath(path.relative(sourceRoot, filePath)) || path.basename(filePath);
  const preset = RULE_PRESETS[relativePath];
  const prefix = frameworkPrefix(relativePath);
  const heading = findFirstHeading(parsed.body);
  const fallbackName = fallbackNameFromRelativePath(relativePath);
  const rawName = preset?.name || hints.name?.trim() || heading || fallbackName;
  const name =
    prefix && !rawName.startsWith(prefix) && relativePath.startsWith("profiles/")
      ? `${prefix}${rawName}`
      : rawName;
  const fallbackDescription = `从本地规则 ${name} 导入`;
  const description =
    hints.description?.trim() || toSummaryDescription(parsed.body, fallbackDescription);
  const longDescription = stripMarkdownHeadingMarks(parsed.body) || description;
  const author =
    explicitAuthor?.trim() ||
    process.env.HUB_ACTOR?.trim() ||
    process.env.USER?.trim() ||
    "local-import";
  const tags = dedupeTags(preset?.tags || inferTags(relativePath, name, description));
  const slug = preset?.slug || stableFallbackSlug(relativePath);
  const categorySlug = inferCategory(relativePath, opts, preset);

  return {
    sourcePath: filePath,
    relativePath,
    name,
    slug,
    description,
    longDescription,
    author,
    categorySlug,
    tags,
    files: [
      {
        name: "RULE.md",
        path: "RULE.md",
        content,
      },
    ],
  };
}

function matchesOnlyFilters(pkg: RulePackage, only: string[]): boolean {
  if (only.length === 0) return true;
  const target = `${pkg.name}\n${pkg.slug}\n${pkg.relativePath}`.toLowerCase();
  return only.some((needle) => target.includes(needle.toLowerCase()));
}

function ensureUniqueSlugs(packages: RulePackage[]): void {
  const used = new Set<string>();
  for (const pkg of packages) {
    const base = pkg.slug;
    let candidate = base;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    pkg.slug = candidate;
    used.add(candidate);
  }
}

function buildHeaders(pkg: RulePackage, opts: CliOptions): Headers {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.bearer) {
    headers.set("authorization", `Bearer ${opts.bearer}`);
  }
  if (opts.hubAdminSecret) {
    headers.set("x-hub-admin-secret", opts.hubAdminSecret);
  }
  const actor = opts.hubActor?.trim() || pkg.author.trim();
  if (actor) {
    headers.set("x-hub-actor", encodeURIComponent(actor));
  }
  return headers;
}

async function postRule(pkg: RulePackage, opts: CliOptions): Promise<{ slug?: string }> {
  const url = new URL("/api/rules", opts.api);
  const payload = {
    name: pkg.name,
    slug: pkg.slug,
    description: pkg.description,
    author: pkg.author,
    categorySlug: pkg.categorySlug,
    longDescription: pkg.longDescription || undefined,
    tags: pkg.tags.length ? pkg.tags : undefined,
    initialFiles: pkg.files,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(pkg, opts),
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as
    | { code?: number; message?: string; data?: { rule?: { slug?: string } } }
    | null;

  if (!response.ok || json?.code !== 0) {
    throw new Error(json?.message || `创建失败，HTTP ${response.status}`);
  }

  return { slug: json?.data?.rule?.slug };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const sourceRoot = path.resolve(opts.source);
  const files = await discoverRuleFiles(sourceRoot);
  if (files.length === 0) {
    throw new Error(`没有找到任何可导入的 Rule Markdown: ${sourceRoot}`);
  }

  console.log(`[scan] 发现 ${files.length} 个 Rule Markdown`);

  const packages: RulePackage[] = [];
  for (const filePath of files) {
    const pkg = await buildRulePackage(filePath, sourceRoot, opts.author, opts);
    if (!matchesOnlyFilters(pkg, opts.only)) {
      console.log(`[skip] ${pkg.name} <- ${pkg.relativePath}`);
      continue;
    }
    packages.push(pkg);
  }

  ensureUniqueSlugs(packages);

  for (const pkg of packages) {
    console.log(
      `[ready] ${pkg.name} -> ${pkg.slug} | ${pkg.categorySlug} | ${pkg.tags.join(", ")} | ${pkg.relativePath}`,
    );
  }

  if (packages.length === 0) {
    throw new Error("没有匹配到待导入的 Rule");
  }

  if (opts.dryRun) {
    console.log(`[dry-run] 仅扫描，不发请求。共 ${packages.length} 个 Rule 待导入`);
    return;
  }

  let success = 0;
  let failed = 0;

  for (let index = 0; index < packages.length; index += 1) {
    const pkg = packages[index];
    try {
      const result = await postRule(pkg, opts);
      success += 1;
      console.log(
        `[ok] ${pkg.name}${result.slug ? ` -> /rules/${result.slug}` : ""} (${index + 1}/${packages.length})`,
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fail] ${pkg.name} (${pkg.relativePath})`);
      console.error(`       ${message}`);
    }

    if (index < packages.length - 1 && opts.delayMs > 0) {
      await sleep(opts.delayMs);
    }
  }

  console.log(`[done] success=${success} failed=${failed} total=${packages.length}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
