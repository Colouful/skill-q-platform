import { prisma } from "@/lib/prisma";
import { buildScenarioManifest } from "@/lib/scenario-manifest";
import { resolveScenarioAssets } from "@/lib/scenario-assets";
import { CATALOG_PUBLISH_STATUS, isPublishedCatalogStatus } from "@/lib/catalog";
import { MODERATION_STATUS } from "@/lib/moderation";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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
