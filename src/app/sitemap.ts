import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { rolePath, rulePath, scenarioPath, skillPath } from "@/lib/slug-url";

/** 构建期不预渲染，避免 Docker/CI 从构建机 IP 连库被拒导致超时 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const [skills, rules, roles, scenarios] = await Promise.all([
    prisma.skill.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
    prisma.rule.findMany({
      where: { moderationStatus: MODERATION_STATUS.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
    prisma.roleTemplate.findMany({
      where: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
    prisma.scenarioPackage.findMany({
      where: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/skills`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/rules`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/roles`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/scenarios`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/install`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/trending`, changeFrequency: "daily", priority: 0.7 },
  ];

  return [
    ...staticEntries,
    ...skills.map((s) => ({
      url: `${base}${skillPath(s.slug)}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...rules.map((r) => ({
      url: `${base}${rulePath(r.slug)}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...roles.map((role) => ({
      url: `${base}${rolePath(role.slug)}`,
      lastModified: role.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...scenarios.map((scenario) => ({
      url: `${base}${scenarioPath(scenario.slug)}`,
      lastModified: scenario.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.78,
    })),
  ];
}
