import { prisma } from "@/lib/prisma";
import { buildScenarioManifest, normalizeManifestProfile } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { toManifestRoleId, toManifestRoleIds, toManifestRuleIds, toManifestSkillIds } from "@/lib/manifest-registry-id";
import { CATALOG_PUBLISH_STATUS, isPublishedCatalogStatus, stringArrayFromJson } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const scenario = await prisma.scenarioPackage.findUnique({
      where: { slug },
      include: {
        entryRole: {
          include: {
            skillLinks: {
              where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
              orderBy: { sortOrder: "asc" },
              include: { skill: { include: { category: true } } },
            },
            ruleLinks: {
              where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
              orderBy: { sortOrder: "asc" },
              include: { rule: { include: { category: true } } },
            },
          },
        },
        domainLinks: { include: { domain: true } },
        roles: {
          where: { role: { publishStatus: CATALOG_PUBLISH_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: {
            role: {
              include: {
                skillLinks: {
                  where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
                  orderBy: { sortOrder: "asc" },
                  include: { skill: { include: { category: true } } },
                },
                ruleLinks: {
                  where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
                  orderBy: { sortOrder: "asc" },
                  include: { rule: { include: { category: true } } },
                },
              },
            },
          },
        },
        skills: {
          where: { skill: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { skill: { include: { category: true } } },
        },
        rules: {
          where: { rule: { moderationStatus: MODERATION_STATUS.PUBLISHED } },
          orderBy: { sortOrder: "asc" },
          include: { rule: { include: { category: true } } },
        },
      },
    });

    if (!scenario || !isPublishedCatalogStatus(scenario.publishStatus)) {
      return jsonErr("场景方案不存在", 404);
    }

    const searchParams = new URL(req.url).searchParams;
    const requestedProfile = searchParams.get("profile")?.trim();
    const scenarioProfiles = stringArrayFromJson(scenario.supportedProfiles);
    const effectiveProfile = requestedProfile ? normalizeManifestProfile(requestedProfile) : null;

    const resolved = effectiveProfile
      ? resolveScenarioAssets(scenario, { profile: effectiveProfile })
      : resolveScenarioAssets(scenario);
    const manifestProfile = effectiveProfile ?? normalizeManifestProfile(scenarioProfiles[0] || "default");
    const manifestResolved = effectiveProfile
      ? resolved
      : resolveScenarioAssets(scenario, { profile: manifestProfile });
    const manifest = buildScenarioManifest({
      scenarioSlug: scenario.slug,
      profile: manifestProfile,
      recommendedIdes: scenario.recommendedIdes,
      entryRoleSlug: manifestResolved.entryRoleSlug
        ? toManifestRoleId(
            manifestResolved.roles.find((role) => role.slug === manifestResolved.entryRoleSlug) ?? {
              slug: manifestResolved.entryRoleSlug,
            },
          )
        : null,
      roles: toManifestRoleIds(manifestResolved.roles),
      skills: toManifestSkillIds(manifestResolved.resolvedSkills),
      rules: toManifestRuleIds(manifestResolved.resolvedRules),
    });

    return jsonOk({
      scenario,
      manifest,
      resolvedProfile: effectiveProfile,
      manifestProfile,
      resolvedSkills: resolved.resolvedSkills,
      resolvedRules: resolved.resolvedRules,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
