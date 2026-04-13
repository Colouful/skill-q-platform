import { prisma } from "@/lib/prisma";
import { buildScenarioManifest, normalizeManifestProfile } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { toManifestRuleIds, toManifestSkillIds } from "@/lib/manifest-registry-id";
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
    const requestedProfile = searchParams.get("profile");
    const scenarioProfiles = stringArrayFromJson(scenario.supportedProfiles);
    const effectiveProfile = normalizeManifestProfile(requestedProfile || scenarioProfiles[0] || "default");

    const resolved = resolveScenarioAssets(scenario, { profile: effectiveProfile });
    const manifest = buildScenarioManifest({
      scenarioSlug: scenario.slug,
      profile: effectiveProfile,
      recommendedIdes: scenario.recommendedIdes,
      entryRoleSlug: resolved.entryRoleSlug,
      roles: resolved.roleSlugs,
      skills: toManifestSkillIds(resolved.resolvedSkills),
      rules: toManifestRuleIds(resolved.resolvedRules),
    });

    return jsonOk({
      scenario,
      manifest,
      resolvedSkills: resolved.resolvedSkills,
      resolvedRules: resolved.resolvedRules,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
