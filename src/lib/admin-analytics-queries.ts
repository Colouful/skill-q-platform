import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";

export async function getAnalyticsOverview() {
  const [
    agents,
    skillsPublished,
    rulesPublished,
    skillsPending,
    rulesPending,
    downloadLogs,
    reviews,
  ] = await Promise.all([
    prisma.agent.count(),
    prisma.skill.count({ where: { moderationStatus: MODERATION_STATUS.PUBLISHED } }),
    prisma.rule.count({ where: { moderationStatus: MODERATION_STATUS.PUBLISHED } }),
    prisma.skill.count({ where: { moderationStatus: MODERATION_STATUS.PENDING } }),
    prisma.rule.count({ where: { moderationStatus: MODERATION_STATUS.PENDING } }),
    prisma.downloadLog.count(),
    prisma.review.count(),
  ]);
  return {
    agents,
    skillsPublished,
    rulesPublished,
    skillsPending,
    rulesPending,
    downloadLogs,
    reviews,
  };
}

export type TrendRange = "7d" | "30d" | "90d";

function daysFromRange(r: TrendRange): number {
  if (r === "30d") return 30;
  if (r === "90d") return 90;
  return 7;
}

export async function getAnalyticsTrends(range: TrendRange) {
  const days = daysFromRange(range);
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [downloadRows, skillRows, agentRows] = await Promise.all([
    prisma.$queryRaw<{ day: Date; c: bigint }[]>`
      SELECT DATE(\`createdAt\`) AS day, COUNT(*) AS c
      FROM download_logs
      WHERE \`createdAt\` >= ${since}
      GROUP BY DATE(\`createdAt\`)
      ORDER BY day ASC
    `,
    prisma.$queryRaw<{ day: Date; c: bigint }[]>`
      SELECT DATE(\`createdAt\`) AS day, COUNT(*) AS c
      FROM skills
      WHERE \`createdAt\` >= ${since}
      GROUP BY DATE(\`createdAt\`)
      ORDER BY day ASC
    `,
    prisma.$queryRaw<{ day: Date; c: bigint }[]>`
      SELECT DATE(\`registeredAt\`) AS day, COUNT(*) AS c
      FROM agents
      WHERE \`registeredAt\` >= ${since}
      GROUP BY DATE(\`registeredAt\`)
      ORDER BY day ASC
    `,
  ]);

  const mapDay = (rows: { day: Date; c: bigint }[]) =>
    rows.map((r) => ({
      day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
      count: Number(r.c),
    }));

  return {
    range,
    downloadsByDay: mapDay(downloadRows),
    skillsCreatedByDay: mapDay(skillRows),
    newAgentsByDay: mapDay(agentRows),
  };
}

export type AnalyticsHighlights = {
  topSkills: { id: string; name: string; slug: string; downloads: number }[];
  topRules: { id: string; name: string; slug: string; downloads: number }[];
  recentAgents: {
    id: string;
    name: string;
    slug: string;
    level: number;
    registeredAt: Date;
  }[];
};

export async function getAnalyticsHighlights(): Promise<AnalyticsHighlights> {
  const [topSkills, topRules, recentAgents] = await Promise.all([
    prisma.skill.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      orderBy: { downloads: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, downloads: true },
    }),
    prisma.rule.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      orderBy: { downloads: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, downloads: true },
    }),
    prisma.agent.findMany({
      orderBy: { registeredAt: "desc" },
      take: 8,
      select: { id: true, name: true, slug: true, level: true, registeredAt: true },
    }),
  ]);
  return { topSkills, topRules, recentAgents };
}

export async function getAnalyticsCategories() {
  const [skillCats, ruleCats] = await Promise.all([
    prisma.skill.groupBy({
      by: ["categoryId"],
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      _count: { _all: true },
    }),
    prisma.rule.groupBy({
      by: ["categoryId"],
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      _count: { _all: true },
    }),
  ]);

  const catIds = [...new Set([...skillCats.map((s) => s.categoryId), ...ruleCats.map((r) => r.categoryId)])];
  const categories = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true, slug: true, resourceType: true },
  });
  const nameById = Object.fromEntries(categories.map((c) => [c.id, c]));

  return {
    skills: skillCats.map((s) => ({
      categoryId: s.categoryId,
      name: nameById[s.categoryId]?.name ?? s.categoryId,
      slug: nameById[s.categoryId]?.slug,
      count: s._count._all,
    })),
    rules: ruleCats.map((r) => ({
      categoryId: r.categoryId,
      name: nameById[r.categoryId]?.name ?? r.categoryId,
      slug: nameById[r.categoryId]?.slug,
      count: r._count._all,
    })),
  };
}
