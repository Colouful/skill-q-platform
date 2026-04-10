#!/usr/bin/env node

const { existsSync } = require("node:fs");
const { resolve } = require("node:path");
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
const runningInDocker = existsSync("/.dockerenv");
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
