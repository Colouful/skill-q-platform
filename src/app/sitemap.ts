import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const [skills, rules] = await Promise.all([
    prisma.skill.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
    prisma.rule.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/skills`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/rules`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/trending`, changeFrequency: "daily", priority: 0.7 },
  ];

  return [
    ...staticEntries,
    ...skills.map((s) => ({
      url: `${base}/skills/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...rules.map((r) => ({
      url: `${base}/rules/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];
}
