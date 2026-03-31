import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildScenarioManifest } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { CATALOG_PUBLISH_STATUS, isPublishedCatalogStatus } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const scenario = await prisma.scenarioPackage.findUnique({
    where: { slug },
    include: {
      entryRole: {
        include: {
          skillLinks: {
            where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
            orderBy: { sortOrder: "asc" },
            include: { skill: true },
          },
          ruleLinks: {
            where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
            orderBy: { sortOrder: "asc" },
            include: { rule: true },
          },
        },
      },
      roles: {
        where: { role: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: {
          role: {
            include: {
              skillLinks: {
                where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
                orderBy: { sortOrder: "asc" },
                include: { skill: true },
              },
              ruleLinks: {
                where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
                orderBy: { sortOrder: "asc" },
                include: { rule: true },
              },
            },
          },
        },
      },
      skills: {
        where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { skill: true },
      },
      rules: {
        where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
        orderBy: { sortOrder: "asc" },
        include: { rule: true },
      },
    },
  });

  if (!scenario || !isPublishedCatalogStatus(scenario.publishStatus)) {
    return NextResponse.json({ message: "scenario not found" }, { status: 404 });
  }

  const resolved = resolveScenarioAssets(scenario);
  const manifest = buildScenarioManifest({
    scenarioSlug: scenario.slug,
    supportedProfiles: scenario.supportedProfiles,
    recommendedIdes: scenario.recommendedIdes,
    entryRoleSlug: resolved.entryRoleSlug,
    roles: resolved.roleSlugs,
    skills: resolved.skillSlugs,
    rules: resolved.ruleSlugs,
  });

  return NextResponse.json(manifest, {
    headers: {
      "Content-Disposition": `inline; filename="${scenario.slug}.manifest.json"`,
      "Cache-Control": "no-store",
    },
  });
}
