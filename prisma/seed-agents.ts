import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { generateApiKey, hashApiKey, apiKeyPrefix } from "../src/lib/agent-auth";

function poolConfigFromDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL 未配置");
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, "") || undefined;
  const charset = u.searchParams.get("charset") ?? undefined;
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
    ...(charset ? { charset } : {}),
  };
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(poolConfigFromDatabaseUrl()),
});

const suffix = `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;

const SEED = [
  {
    name: `Seed Agent Lv1 ${suffix}`,
    slug: `seed-agent-lv1-${suffix}`,
    level: 1,
    levelName: "见习特工",
    experience: 100,
  },
  {
    name: `Seed Agent Lv2 ${suffix}`,
    slug: `seed-agent-lv2-${suffix}`,
    level: 2,
    levelName: "初级特工",
    experience: 800,
  },
  {
    name: `Seed Agent Lv3 ${suffix}`,
    slug: `seed-agent-lv3-${suffix}`,
    level: 3,
    levelName: "资深特工",
    experience: 3500,
  },
  {
    name: `Seed Agent Lv4 ${suffix}`,
    slug: `seed-agent-lv4-${suffix}`,
    level: 4,
    levelName: "王牌特工",
    experience: 12000,
  },
] as const;

async function main() {
  const printedKeys: { slug: string; apiKey: string }[] = [];

  for (const row of SEED) {
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = apiKeyPrefix(rawKey);

    await prisma.agent.create({
      data: {
        name: row.name,
        slug: row.slug,
        agentType: "unknown",
        level: row.level,
        levelName: row.levelName,
        experience: row.experience,
        avatar: "/window.svg",
        metadata: { seededBy: "prisma/seed-agents.ts" } as object,
        apiKeys: {
          create: {
            keyHash,
            keyPrefix,
            name: "Seed",
            scopes: [],
            rateLimit: 100,
          },
        },
      },
    });

    printedKeys.push({ slug: row.slug, apiKey: rawKey });
  }

  console.log("seed-agents: 已创建", SEED.length, "个 Agent。以下为一次性明文 Key（请仅用于开发环境）：");
  for (const p of printedKeys) {
    console.log(`  [${p.slug}] ${p.apiKey}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
