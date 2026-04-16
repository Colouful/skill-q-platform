#!/usr/bin/env node

const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { hostname } = require("node:os");
const { spawnSync } = require("node:child_process");

const repoRoot = resolve(__dirname, "..");
const generatedDir = resolve(repoRoot, "src/generated/prisma");
const generatedMarkers = [
  "client.js",
  "index.js",
  "index.d.ts",
  "schema.prisma",
];

function truthyEnv(value) {
  return /^(1|true|yes|on)$/i.test(String(value ?? "").trim());
}

function hasBundledPrismaClient() {
  return generatedMarkers.every((file) => existsSync(resolve(generatedDir, file)));
}

function isContainerRuntime() {
  if (existsSync("/.dockerenv") || existsSync("/run/.containerenv")) {
    return true;
  }

  try {
    const cgroup = readFileSync("/proc/1/cgroup", "utf8");
    if (/(docker|containerd|kubepods|podman)/i.test(cgroup)) {
      return true;
    }
  } catch {
    // ignore and continue probing other container signals
  }

  // BuildKit RUN sandboxes default to the hostname `buildkitsandbox`.
  if (hostname() === "buildkitsandbox") {
    return true;
  }

  return false;
}

function log(message) {
  process.stdout.write(`[prisma-generate] ${message}\n`);
}

const explicitSkip =
  truthyEnv(process.env.SKIP_PRISMA_GENERATE) ||
  truthyEnv(process.env.SKIP_PRISMA_POSTINSTALL);

if (explicitSkip) {
  log("检测到 SKIP_PRISMA_GENERATE / SKIP_PRISMA_POSTINSTALL，跳过 prisma generate。");
  process.exit(0);
}

const runningInCi = truthyEnv(process.env.CI);
const runningInDocker = isContainerRuntime();
const bundledClientReady = hasBundledPrismaClient();

if (bundledClientReady && (runningInCi || runningInDocker)) {
  log("检测到 CI / Docker 构建环境，且仓库已包含可用的 src/generated/prisma，跳过 prisma generate。");
  process.exit(0);
}

log("开始执行 prisma generate。");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "generate"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
