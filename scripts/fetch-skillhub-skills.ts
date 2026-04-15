import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

type CliOptions = {
  api: string;
  web: string;
  category: string;
  dest: string;
  pageSize: number;
  startPage: number;
  endPage?: number;
  maxSkills?: number;
  concurrency: number;
  overwrite: boolean;
  dryRun: boolean;
  only: string[];
  sortBy: string;
  order: "asc" | "desc";
};

type SkillSummary = {
  category: string;
  created_at: number;
  description: string;
  description_zh?: string | null;
  downloads: number;
  homepage?: string | null;
  installs: number;
  name: string;
  ownerName?: string | null;
  score: number;
  slug: string;
  source?: string | null;
  stars: number;
  tags?: string[] | null;
  updated_at: number;
  version?: string | null;
};

type SkillListResponse = {
  code: number;
  data?: {
    skills?: SkillSummary[];
    total?: number;
  };
  message?: string;
};

type SkillDetailResponse = {
  latestVersion?: {
    changelog?: string | null;
    createdAt?: number | null;
    version?: string | null;
  };
  owner?: {
    displayName?: string | null;
    handle?: string | null;
    image?: string | null;
  };
  skill?: {
    category?: string | null;
    createdAt?: number | null;
    displayName?: string | null;
    slug?: string | null;
    source?: string | null;
    summary?: string | null;
    summary_zh?: string | null;
    tags?: Record<string, string> | null;
    updatedAt?: number | null;
  };
};

type SkillFilesResponse = {
  count?: number;
  files?: Array<{
    path: string;
    sha256?: string;
    size?: number;
  }>;
  version?: string | null;
};

const DEFAULT_API = "https://api.skillhub.cn";
const DEFAULT_WEB = "https://skillhub.cn";
const DEFAULT_CATEGORY = "developer-tools";
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_START_PAGE = 1;
const DEFAULT_CONCURRENCY = 6;

function printHelp(): void {
  console.log(`
从 SkillHub 拉取指定分类的 Skill 文件，并写入本地 skills 目录。

用法:
  npm run fetch:skillhub-skills -- --category developer-tools

常用参数:
  --category <slug>         分类 slug，默认 ${DEFAULT_CATEGORY}
  --dest <目录>             输出目录，默认 skills/skillhub-<category>
  --page-size <数量>        分页大小，默认 ${DEFAULT_PAGE_SIZE}
  --start-page <页码>       起始页，默认 ${DEFAULT_START_PAGE}
  --end-page <页码>         结束页（含）
  --max-skills <数量>       最多抓取多少个 Skill
  --concurrency <数量>      并发下载数，默认 ${DEFAULT_CONCURRENCY}
  --only <关键字>           仅保留 slug / 名称 / 作者匹配的 Skill，可重复传
  --sort-by <字段>          列表排序字段，默认 score
  --order <asc|desc>        排序方向，默认 desc
  --overwrite               如果目标目录已存在则覆盖重下
  --dry-run                 只列出将要下载的 Skill，不写文件

示例:
  npm run fetch:skillhub-skills -- --category developer-tools --max-skills 10
  npm run fetch:skillhub-skills -- --category developer-tools --dest skills/skillhub-devtools --overwrite
`.trim());
}

function parseArgs(argv: string[]): CliOptions {
  let category = DEFAULT_CATEGORY;
  let dest = "";
  let api = DEFAULT_API;
  let web = DEFAULT_WEB;
  let pageSize = DEFAULT_PAGE_SIZE;
  let startPage = DEFAULT_START_PAGE;
  let endPage: number | undefined;
  let maxSkills: number | undefined;
  let concurrency = DEFAULT_CONCURRENCY;
  let overwrite = false;
  let dryRun = false;
  const only: string[] = [];
  let sortBy = "score";
  let order: "asc" | "desc" = "desc";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--category") {
      category = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--dest") {
      dest = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--api") {
      api = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--web") {
      web = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--page-size") {
      pageSize = Number(next ?? DEFAULT_PAGE_SIZE);
      i += 1;
      continue;
    }
    if (arg === "--start-page") {
      startPage = Number(next ?? DEFAULT_START_PAGE);
      i += 1;
      continue;
    }
    if (arg === "--end-page") {
      endPage = Number(next ?? "");
      i += 1;
      continue;
    }
    if (arg === "--max-skills") {
      maxSkills = Number(next ?? "");
      i += 1;
      continue;
    }
    if (arg === "--concurrency") {
      concurrency = Number(next ?? DEFAULT_CONCURRENCY);
      i += 1;
      continue;
    }
    if (arg === "--only") {
      if (next) only.push(next);
      i += 1;
      continue;
    }
    if (arg === "--sort-by") {
      sortBy = next ?? "";
      i += 1;
      continue;
    }
    if (arg === "--order") {
      const value = (next ?? "").toLowerCase();
      if (value === "asc" || value === "desc") {
        order = value;
      } else {
        throw new Error("--order 只支持 asc 或 desc");
      }
      i += 1;
      continue;
    }
    if (arg === "--overwrite") {
      overwrite = true;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    throw new Error(`未知参数: ${arg}`);
  }

  if (!category.trim()) {
    throw new Error("缺少 --category");
  }
  if (!api.trim()) {
    throw new Error("缺少 --api");
  }
  if (!web.trim()) {
    throw new Error("缺少 --web");
  }
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error("--page-size 必须是正整数");
  }
  if (!Number.isInteger(startPage) || startPage <= 0) {
    throw new Error("--start-page 必须是正整数");
  }
  if (endPage !== undefined && (!Number.isInteger(endPage) || endPage < startPage)) {
    throw new Error("--end-page 必须大于等于 --start-page");
  }
  if (maxSkills !== undefined && (!Number.isInteger(maxSkills) || maxSkills <= 0)) {
    throw new Error("--max-skills 必须是正整数");
  }
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error("--concurrency 必须是正整数");
  }

  return {
    api: api.trim().replace(/\/+$/, ""),
    web: web.trim().replace(/\/+$/, ""),
    category: category.trim(),
    dest: dest.trim() || path.join("skills", `skillhub-${category.trim()}`),
    pageSize,
    startPage,
    ...(endPage !== undefined ? { endPage } : {}),
    ...(maxSkills !== undefined ? { maxSkills } : {}),
    concurrency,
    overwrite,
    dryRun,
    only,
    sortBy: sortBy.trim() || "score",
    order,
  };
}

function matchesOnlyFilters(summary: SkillSummary, only: string[]): boolean {
  if (only.length === 0) return true;
  const target = [summary.slug, summary.name, summary.ownerName || ""].join("\n").toLowerCase();
  return only.some((item) => target.includes(item.toLowerCase()));
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function normalizeRemotePath(filePath: string): string {
  const normalized = path.posix.normalize(filePath.replace(/\\/g, "/")).replace(/^\.\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("..") || path.posix.isAbsolute(normalized)) {
    throw new Error(`非法文件路径: ${filePath}`);
  }
  return normalized;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) {
        return response;
      }
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await sleep(400 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithRetry(url);
  return (await response.json()) as T;
}

function buildSkillPageUrl(web: string, slug: string): string {
  return `${web}/skills/${encodeURIComponent(slug)}`;
}

async function collectSkillSummaries(opts: CliOptions): Promise<SkillSummary[]> {
  const results: SkillSummary[] = [];
  const seen = new Set<string>();
  let page = opts.startPage;
  let totalPages = Number.POSITIVE_INFINITY;

  while (page <= totalPages) {
    if (opts.endPage !== undefined && page > opts.endPage) break;
    if (opts.maxSkills !== undefined && results.length >= opts.maxSkills) break;

    const url = new URL("/api/skills", opts.api);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(opts.pageSize));
    url.searchParams.set("sortBy", opts.sortBy);
    url.searchParams.set("order", opts.order);
    url.searchParams.set("category", opts.category);

    const json = await fetchJson<SkillListResponse>(url.toString());
    if (json.code !== 0) {
      throw new Error(json.message || `列表请求失败: ${url}`);
    }

    const skills = json.data?.skills ?? [];
    const total = json.data?.total ?? 0;
    totalPages = Math.max(1, Math.ceil(total / opts.pageSize));

    console.log(`[list] page ${page}/${totalPages} -> ${skills.length} items (category=${opts.category})`);

    if (skills.length === 0) break;

    for (const skill of skills) {
      if (!matchesOnlyFilters(skill, opts.only)) continue;
      if (seen.has(skill.slug)) continue;
      seen.add(skill.slug);
      results.push(skill);
      if (opts.maxSkills !== undefined && results.length >= opts.maxSkills) break;
    }

    page += 1;
  }

  return results;
}

async function downloadSkillFiles(
  targetDir: string,
  slug: string,
  files: SkillFilesResponse["files"],
  api: string,
): Promise<void> {
  for (const file of files ?? []) {
    const relativePath = normalizeRemotePath(file.path);
    const url = new URL(`/api/v1/skills/${encodeURIComponent(slug)}/file`, api);
    url.searchParams.set("path", relativePath);

    const response = await fetchWithRetry(url.toString());
    const content = Buffer.from(await response.arrayBuffer());
    const localPath = path.join(targetDir, ...relativePath.split("/"));
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, content);
  }
}

async function writeSourceMeta(
  targetDir: string,
  summary: SkillSummary,
  detail: SkillDetailResponse,
  files: SkillFilesResponse,
  api: string,
  web: string,
): Promise<void> {
  const payload = {
    fetchedAt: new Date().toISOString(),
    sourceSite: "skillhub.cn",
    sourceApi: api,
    category: summary.category,
    slug: summary.slug,
    displayName: detail.skill?.displayName || summary.name,
    owner: {
      name: detail.owner?.displayName || summary.ownerName || null,
      handle: detail.owner?.handle || summary.ownerName || null,
    },
    skillhubPage: buildSkillPageUrl(web, summary.slug),
    originalHomepage: summary.homepage || null,
    version: files.version || detail.latestVersion?.version || summary.version || null,
    summary: {
      en: summary.description || detail.skill?.summary || null,
      zh: summary.description_zh || detail.skill?.summary_zh || null,
    },
    stats: {
      downloads: summary.downloads,
      installs: summary.installs,
      stars: summary.stars,
      score: summary.score,
    },
    remoteFiles: files.files ?? [],
  };

  await fs.writeFile(
    path.join(targetDir, "_skillhub_source.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

function toYamlValue(value: string): string {
  return JSON.stringify(value);
}

function selectMarkdownFallback(files: SkillFilesResponse["files"]): string | null {
  const candidates = (files ?? [])
    .map((file) => file.path)
    .filter((filePath) => filePath.toLowerCase().endsWith(".md"));

  if (candidates.length === 0) return null;

  const preferredNames = ["skills.md", "skill.md", "readme.md"];
  for (const preferred of preferredNames) {
    const hit = candidates.find((item) => item.toLowerCase() === preferred);
    if (hit) return hit;
  }

  return candidates.sort((a, b) => a.length - b.length || a.localeCompare(b))[0] ?? null;
}

async function ensureSkillManifest(
  targetDir: string,
  summary: SkillSummary,
  detail: SkillDetailResponse,
  files: SkillFilesResponse,
): Promise<void> {
  const manifestPath = path.join(targetDir, "SKILL.md");
  if (await pathExists(manifestPath)) {
    return;
  }

  const fallbackMarkdown = selectMarkdownFallback(files.files);
  let content = "";

  if (fallbackMarkdown) {
    const fallbackPath = path.join(targetDir, ...normalizeRemotePath(fallbackMarkdown).split("/"));
    content = await fs.readFile(fallbackPath, "utf8");
  }

  const trimmed = content.trimStart();
  if (trimmed.startsWith("---")) {
    await fs.writeFile(manifestPath, content, "utf8");
    console.log(`[fixup] ${summary.slug} -> generated SKILL.md from ${fallbackMarkdown ?? "markdown"}`);
    return;
  }

  const name = detail.skill?.displayName || summary.name || summary.slug;
  const description = summary.description || detail.skill?.summary || `${name} imported from SkillHub`;
  const author = detail.owner?.displayName || summary.ownerName || "";
  const homepage = summary.homepage || "";
  const frontmatter = [
    "---",
    `name: ${toYamlValue(name)}`,
    `description: ${toYamlValue(description)}`,
    ...(author ? [`author: ${toYamlValue(author)}`] : []),
    ...(homepage ? [`homepage: ${toYamlValue(homepage)}`] : []),
    "---",
    "",
  ].join("\n");

  const body = content.trim().length > 0 ? content : `# ${name}\n\n${description}\n`;
  await fs.writeFile(manifestPath, `${frontmatter}${body.trimStart()}\n`, "utf8");
  console.log(
    `[fixup] ${summary.slug} -> generated SKILL.md${fallbackMarkdown ? ` from ${fallbackMarkdown}` : ""}`,
  );
}

async function downloadOneSkill(
  summary: SkillSummary,
  opts: CliOptions,
): Promise<"downloaded" | "skipped"> {
  const targetDir = path.resolve(opts.dest, summary.slug);
  const alreadyExists = await pathExists(targetDir);

  if (alreadyExists && !opts.overwrite) {
    console.log(`[skip] ${summary.slug} -> ${targetDir}`);
    return "skipped";
  }

  if (opts.dryRun) {
    console.log(`[dry-run] ${summary.slug} -> ${targetDir}`);
    return alreadyExists ? "skipped" : "downloaded";
  }

  if (alreadyExists) {
    await fs.rm(targetDir, { recursive: true, force: true });
  }

  await fs.mkdir(targetDir, { recursive: true });

  try {
    const detailUrl = `${opts.api}/api/v1/skills/${encodeURIComponent(summary.slug)}`;
    const filesUrl = `${opts.api}/api/v1/skills/${encodeURIComponent(summary.slug)}/files`;
    const [detail, files] = await Promise.all([
      fetchJson<SkillDetailResponse>(detailUrl),
      fetchJson<SkillFilesResponse>(filesUrl),
    ]);

    if (!files.files?.length) {
      throw new Error(`远端没有文件清单: ${summary.slug}`);
    }

    await downloadSkillFiles(targetDir, summary.slug, files.files, opts.api);
    await ensureSkillManifest(targetDir, summary, detail, files);
    await writeSourceMeta(targetDir, summary, detail, files, opts.api, opts.web);

    if (!(await pathExists(path.join(targetDir, "SKILL.md")))) {
      throw new Error(`缺少 SKILL.md: ${summary.slug}`);
    }

    console.log(`[ok] ${summary.slug} | files=${files.files.length} -> ${targetDir}`);
    return "downloaded";
  } catch (error) {
    await fs.rm(targetDir, { recursive: true, force: true });
    throw error;
  }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;

  async function runWorker(): Promise<void> {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(workers);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const skills = await collectSkillSummaries(opts);

  if (skills.length === 0) {
    throw new Error(`没有找到符合条件的 Skill: category=${opts.category}`);
  }

  console.log(`[ready] total=${skills.length} dest=${path.resolve(opts.dest)}`);

  if (!opts.dryRun) {
    await fs.mkdir(path.resolve(opts.dest), { recursive: true });
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  await runWithConcurrency(skills, opts.concurrency, async (summary, index) => {
    console.log(`[task] (${index + 1}/${skills.length}) ${summary.slug}`);
    try {
      const result = await downloadOneSkill(summary, opts);
      if (result === "downloaded") downloaded += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[fail] ${summary.slug}`);
      console.error(`       ${message}`);
    }
  });

  console.log(`[done] downloaded=${downloaded} skipped=${skipped} failed=${failed} total=${skills.length}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
