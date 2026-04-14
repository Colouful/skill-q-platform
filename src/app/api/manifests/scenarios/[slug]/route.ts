import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildScenarioManifest, normalizeManifestProfile } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { toManifestRoleId, toManifestRoleIds, toManifestRuleIds, toManifestSkillIds } from "@/lib/manifest-registry-id";
import { CATALOG_PUBLISH_STATUS, isPublishedCatalogStatus, stringArrayFromJson } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
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

  const searchParams = new URL(req.url).searchParams;
  const requestedProfile = searchParams.get("profile")?.trim();
  const effectiveProfile = requestedProfile ? normalizeManifestProfile(requestedProfile) : "default";

  const resolved = requestedProfile
    ? resolveScenarioAssets(scenario, { profile: effectiveProfile })
    : resolveScenarioAssets(scenario);
  const manifest = buildScenarioManifest({
    scenarioSlug: scenario.slug,
    profile: effectiveProfile,
    recommendedIdes: scenario.recommendedIdes,
    entryRoleSlug: resolved.entryRoleSlug
      ? toManifestRoleId(resolved.roles.find((role) => role.slug === resolved.entryRoleSlug) ?? { slug: resolved.entryRoleSlug })
      : null,
    roles: toManifestRoleIds(resolved.roles),
    skills: toManifestSkillIds(resolved.resolvedSkills),
    rules: toManifestRuleIds(resolved.resolvedRules),
  });

  return NextResponse.json(manifest, {
    headers: {
      "Content-Disposition": `inline; filename="${scenario.slug}.manifest.json"`,
      "Cache-Control": "no-store",
    },
  });
}
