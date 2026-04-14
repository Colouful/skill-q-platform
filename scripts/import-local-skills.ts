import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { resolveSkillImportPreset } from "../src/lib/hub-registry-contract";
import { metaToSkillHints, parseSkillMd } from "../src/lib/skill-md-parse";

type CliOptions = {
  source: string;
  api: string;
  category: string;
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

type SkillPackage = {
  root: string;
  relativePath: string;
  slug: string;
  registryId: string;
  manifestId: string;
  name: string;
  description: string;
  longDescription: string;
  author: string;
  files: FileEntry[];
};

const DEFAULT_API = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
const DEFAULT_CATEGORY = "dev-tools";
const DEFAULT_DELAY_MS = 2200;
const MAX_INITIAL_FILES = 200;

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
const BINARY_EXTENSIONS = new Set([
  ".7z",
  ".bin",
  ".class",
  ".dll",
  ".dylib",
  ".eot",
  ".exe",
  ".gif",
  ".gz",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".pdf",
  ".png",
  ".pyc",
  ".so",
  ".svgz",
  ".tar",
  ".tgz",
  ".ttf",
  ".war",
  ".wasm",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

function printHelp(): void {
  console.log(`
从本地目录读取 Skill 包，并调用当前站点 /api/skills 导入。

用法:
  npm run import:skills-local -- --source <目录>

常用参数:
  --source <目录>            必填。单个 Skill 目录，或包含多个 Skill 的根目录
  --api <地址>              站点地址，默认 ${DEFAULT_API}
  --category <slug>         分类，默认 ${DEFAULT_CATEGORY}
  --author <作者>           创建时使用的 author；默认取 SKILL.md author 或当前系统用户
  --only <关键字>           仅导入名称或路径中包含关键字的 Skill，可重复传
  --dry-run                 只扫描并打印，不发请求
  --delay-ms <毫秒>         每次创建后的等待，默认 ${DEFAULT_DELAY_MS}ms，用于避开 30/min 限流

认证相关:
  --bearer <API_KEY>        站点开启“上传需登录”时使用 Agent API Key
  --hub-actor <昵称>        站点开启 HUB_AUTH 时使用；默认跟随最终 author
  --hub-admin-secret <值>   仅用于绕过 HUB_AUTH 作者校验；不能替代登录态

示例:
  npm run import:skills-local -- \\
    --source /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/.agents/skills \\
    --author lizhenwei \\
    --dry-run

  npm run import:skills-local -- \\
    --source /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/.agents/skills \\
    --author lizhenwei \\
    --api http://localhost:3000 \\
    --category dev-tools \\
    --bearer sk_xxx
`.trim());
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    source: "",
    api: DEFAULT_API,
    category: DEFAULT_CATEGORY,
    author: process.env.SKILL_IMPORT_AUTHOR?.trim() || undefined,
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
  if (!opts.category) {
    throw new Error("缺少 --category");
  }
  if (!Number.isFinite(opts.delayMs) || opts.delayMs < 0) {
    throw new Error("--delay-ms 必须是大于等于 0 的数字");
  }

  return opts;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function findSkillMdPath(dir: string): Promise<string | null> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const hit = entries.find((entry) => entry.isFile() && entry.name.toLowerCase() === "skill.md");
  return hit ? path.join(dir, hit.name) : null;
}

async function discoverSkillRoots(source: string): Promise<string[]> {
  const absoluteSource = path.resolve(source);
  const stat = await fs.stat(absoluteSource).catch(() => null);
  if (!stat) throw new Error(`目录不存在: ${absoluteSource}`);
  if (!stat.isDirectory()) throw new Error(`--source 必须是目录: ${absoluteSource}`);

  const selfSkillMd = await findSkillMdPath(absoluteSource);
  if (selfSkillMd) return [absoluteSource];

  const roots: string[] = [];

  async function walk(dir: string): Promise<void> {
    const skillMd = await findSkillMdPath(dir);
    if (skillMd) {
      roots.push(dir);
      return;
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
      await walk(path.join(dir, entry.name));
    }
  }

  await walk(absoluteSource);
  roots.sort((a, b) => a.localeCompare(b));
  return roots;
}

function shouldSkipFileName(name: string): boolean {
  if (NOISE_FILE_NAMES.has(name)) return true;
  if (name.startsWith(".") && name.toLowerCase() !== ".env.example") return true;
  return false;
}

function isLikelyBinary(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 4096));
  for (const byte of sample) {
    if (byte === 0) return true;
  }
  return false;
}

async function collectFiles(root: string): Promise<FileEntry[]> {
  const files: FileEntry[] = [];

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
      if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

      const relativePath = path.relative(root, fullPath).split(path.sep).join("/");
      const buf = await fs.readFile(fullPath);
      if (isLikelyBinary(buf)) continue;

      files.push({
        name: path.basename(relativePath),
        path: relativePath,
        content: buf.toString("utf8"),
      });
    }
  }

  await walk(root);
  files.sort((a, b) => {
    const aIsSkillMd = /^SKILL\.md$/i.test(a.path);
    const bIsSkillMd = /^SKILL\.md$/i.test(b.path);
    if (aIsSkillMd && !bIsSkillMd) return -1;
    if (!aIsSkillMd && bIsSkillMd) return 1;
    return a.path.localeCompare(b.path);
  });
  return files;
}

function toSummaryDescription(body: string, fallback: string): string {
  const cleaned = body
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .find((line) => line.length > 0);
  return cleaned?.slice(0, 255) || fallback;
}

async function buildSkillPackage(root: string, explicitAuthor?: string): Promise<SkillPackage> {
  const skillMdPath = await findSkillMdPath(root);
  if (!skillMdPath) {
    throw new Error(`目录缺少 SKILL.md: ${root}`);
  }

  const skillMdContent = await fs.readFile(skillMdPath, "utf8");
  const parsed = parseSkillMd(skillMdContent);
  const hints = metaToSkillHints(parsed.meta);
  const files = await collectFiles(root);
  const relativePath = path.relative(path.resolve(root, "..", "..", ".."), root);

  if (files.length === 0) {
    throw new Error(`目录为空，无法导入: ${root}`);
  }
  if (files.length > MAX_INITIAL_FILES) {
    throw new Error(`文件数量超过接口限制 ${MAX_INITIAL_FILES}: ${root}`);
  }

  const fallbackName = path.basename(root);
  const fallbackDescription = `从本地目录 ${fallbackName} 导入`;
  const author =
    explicitAuthor?.trim() ||
    parsed.meta.author?.trim() ||
    process.env.HUB_ACTOR?.trim() ||
    process.env.USER?.trim() ||
    "local-import";
  const normalizedRelativePath = root.split(path.sep).join("/");
  const preset = resolveSkillImportPreset(normalizedRelativePath);
  const fallbackSlug = root
    .split(path.sep)
    .join("/")
    .replace(/^.*?\.agents\/skills\//, "")
    .replace(/^.*?skills\//, "")
    .replace(/\/SKILL\.md$/i, "")
    .replace(/\/+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const registryId = (
    preset?.registryId ||
    (preset?.slug ?? (fallbackSlug || fallbackName))
  ).toLowerCase();
  const manifestId = registryId;
  return {
    root,
    relativePath,
    slug: preset?.slug || fallbackSlug || fallbackName.toLowerCase(),
    registryId,
    manifestId,
    name: hints.name?.trim() || fallbackName,
    description: hints.description?.trim() || toSummaryDescription(parsed.body, fallbackDescription),
    longDescription: parsed.body.trim(),
    author,
    files,
  };
}

function matchesOnlyFilters(pkg: SkillPackage, only: string[]): boolean {
  if (only.length === 0) return true;
  const target = `${pkg.name}\n${pkg.root}`.toLowerCase();
  return only.some((needle) => target.includes(needle.toLowerCase()));
}

function decorateDuplicateNames(packages: SkillPackage[], sourceRoot: string): void {
  const groups = new Map<string, SkillPackage[]>();
  for (const pkg of packages) {
    const key = pkg.name.trim().toLowerCase();
    const hit = groups.get(key);
    if (hit) hit.push(pkg);
    else groups.set(key, [pkg]);
  }

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const suffixes = new Map<SkillPackage, string>();
    let depth = 1;

    while (suffixes.size < group.length) {
      suffixes.clear();
      const used = new Set<string>();

      for (const pkg of group) {
        const relativeDir = path.relative(sourceRoot, pkg.root).split(path.sep).filter(Boolean);
        const parentSegments = relativeDir.slice(0, -1);
        const candidate = parentSegments.slice(-depth).join("/") || path.basename(pkg.root);
        if (used.has(candidate)) {
          suffixes.clear();
          break;
        }
        used.add(candidate);
        suffixes.set(pkg, candidate);
      }

      if (suffixes.size === group.length) break;
      depth += 1;
    }

    for (const pkg of group) {
      const suffix = suffixes.get(pkg);
      if (!suffix) continue;
      pkg.name = `${pkg.name} [${suffix}]`;
    }
  }
}

function buildHeaders(pkg: SkillPackage, opts: CliOptions): Headers {
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

async function postSkill(pkg: SkillPackage, opts: CliOptions): Promise<{ slug?: string }> {
  const url = new URL("/api/skills", opts.api);
  const payload = {
    name: pkg.name,
    slug: pkg.slug,
    registryId: pkg.registryId,
    manifestId: pkg.manifestId,
    description: pkg.description,
    author: pkg.author,
    categorySlug: opts.category,
    longDescription: pkg.longDescription || undefined,
    initialFiles: pkg.files,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(pkg, opts),
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as
    | { code?: number; message?: string; data?: { skill?: { slug?: string } } }
    | null;

  if (!response.ok || json?.code !== 0) {
    throw new Error(json?.message || `创建失败，HTTP ${response.status}`);
  }

  return { slug: json?.data?.skill?.slug };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const sourceRoot = path.resolve(opts.source);
  const roots = await discoverSkillRoots(sourceRoot);
  if (roots.length === 0) {
    throw new Error(`没有找到任何带 SKILL.md 的目录: ${path.resolve(opts.source)}`);
  }

  console.log(`[scan] 发现 ${roots.length} 个 Skill 目录`);

  const packages: SkillPackage[] = [];
  for (const root of roots) {
    const pkg = await buildSkillPackage(root, opts.author);
    if (!matchesOnlyFilters(pkg, opts.only)) {
      console.log(`[skip] ${pkg.name} <- ${pkg.root}`);
      continue;
    }
    packages.push(pkg);
  }

  decorateDuplicateNames(packages, sourceRoot);

  for (const pkg of packages) {
    console.log(`[ready] ${pkg.name} -> ${pkg.slug} | ${pkg.files.length} files | ${pkg.root}`);
  }

  if (packages.length === 0) {
    throw new Error("没有匹配到待导入的 Skill");
  }

  if (opts.dryRun) {
    console.log(`[dry-run] 仅扫描，不发请求。共 ${packages.length} 个 Skill 待导入`);
    return;
  }

  let success = 0;
  let failed = 0;

  for (let index = 0; index < packages.length; index += 1) {
    const pkg = packages[index];
    try {
      const result = await postSkill(pkg, opts);
      success += 1;
      console.log(
        `[ok] ${pkg.name}${result.slug ? ` -> /skills/${result.slug}` : ""} (${index + 1}/${packages.length})`,
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fail] ${pkg.name} (${pkg.root})`);
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
  process.exit(1);
});
