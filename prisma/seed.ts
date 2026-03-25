import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { syncSkillReviewStats } from "../src/lib/skill-review-stats";
import { MODERATION_STATUS } from "../src/lib/moderation";
import { hashAdminPassword } from "../src/lib/admin-password";
import { seedRules } from "./seed-rules";

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

const CATEGORIES: { name: string; slug: string; sortOrder: number }[] = [
  { name: "开发辅助", slug: "dev-tools", sortOrder: 0 },
  { name: "办公效率", slug: "productivity", sortOrder: 1 },
  { name: "自媒体", slug: "media", sortOrder: 2 },
  { name: "IT 互联网", slug: "it", sortOrder: 3 },
  { name: "金融", slug: "finance", sortOrder: 4 },
  { name: "设计", slug: "design", sortOrder: 5 },
  { name: "教育", slug: "education", sortOrder: 6 },
  { name: "数据分析", slug: "data", sortOrder: 7 },
  { name: "运维", slug: "devops", sortOrder: 8 },
  { name: "安全", slug: "security", sortOrder: 9 },
  { name: "游戏", slug: "gaming", sortOrder: 10 },
  { name: "生活", slug: "life", sortOrder: 11 },
  { name: "科研", slug: "research", sortOrder: 12 },
  { name: "写作", slug: "writing", sortOrder: 13 },
  { name: "其他", slug: "misc", sortOrder: 14 },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: {
        slug_resourceType: { slug: c.slug, resourceType: "skill" },
      },
      create: {
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        resourceType: "skill",
      },
      update: { name: c.name, sortOrder: c.sortOrder },
    });
  }

  const devCat = await prisma.category.findUniqueOrThrow({
    where: { slug_resourceType: { slug: "dev-tools", resourceType: "skill" } },
  });

  const existing = await prisma.skill.findFirst({ where: { slug: "hello-agenthub" } });
  if (!existing) {
    const skill = await prisma.skill.create({
      data: {
        name: "Hello 虾球Hub",
        slug: "hello-agenthub",
        description: "示例 Skill：展示 虾球Hub 的种子数据。",
        longDescription: "## 说明\n\n这是一个示例 OpenClaw Skill。",
        author: "虾球Hub",
        categoryId: devCat.id,
        isFeatured: true,
        moderationStatus: MODERATION_STATUS.PUBLISHED,
        tags: ["demo", "starter"],
        versions: {
          create: {
            version: "1.0.0",
            changelog: "首个版本",
            files: [{ name: "SKILL.md", path: "SKILL.md", content: "---\nname: hello\n---\n" }],
            isLatest: true,
          },
        },
      },
    });
    console.log("Seeded skill:", skill.id);
  }

  const helloSkill = await prisma.skill.findUnique({
    where: { slug: "hello-agenthub" },
    select: { id: true },
  });
  if (helloSkill) {
    const rc = await prisma.review.count({ where: { skillId: helloSkill.id } });
    if (rc === 0) {
      await prisma.review.createMany({
        data: [
          {
            resourceType: "skill",
            resourceId: helloSkill.id,
            skillId: helloSkill.id,
            rating: 5,
            content: "示例评测：结构清晰，开箱即用。",
            author: "种子用户",
            isHelpful: 3,
          },
          {
            resourceType: "skill",
            resourceId: helloSkill.id,
            skillId: helloSkill.id,
            rating: 4,
            content: "不错，期待更多示例。",
            author: "路人甲",
            isHelpful: 0,
          },
        ],
      });
      await syncSkillReviewStats(helloSkill.id);
    }
  }

  await seedRules(prisma);

  const adminLogin = "admin";
  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminLogin } });
  if (!existingAdmin) {
    const passwordHash = await hashAdminPassword("Admin@123");
    await prisma.admin.create({
      data: {
        email: adminLogin,
        passwordHash,
        role: "admin",
        permissions: [],
      },
    });
    console.log("Seeded admin login:", adminLogin, "(password: Admin@123)");
  }

  console.log("Seed done. Categories:", CATEGORIES.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
