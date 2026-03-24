import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

const SEED_MARKER = "prisma/seed-agents.ts";

async function main() {
  const agents = await prisma.agent.findMany({
    select: { id: true, slug: true, metadata: true },
  });
  const seeded = agents.filter((a) => {
    const m = a.metadata as { seededBy?: string } | null;
    return m?.seededBy === SEED_MARKER;
  });
  const withSeedKeys = await prisma.apiKey.count({
    where: { name: "Seed", isRevoked: false },
  });

  console.log("verify-seed-agents:");
  console.log(`  metadata.seededBy=${SEED_MARKER} 的 Agent: ${seeded.length}`);
  console.log(`  name=Seed 且未撤销的 API Key: ${withSeedKeys}`);
  if (seeded.length === 0 && withSeedKeys === 0) {
    console.log("  （若尚未执行 npm run db:seed:agents，上述计数为 0 属正常）");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
