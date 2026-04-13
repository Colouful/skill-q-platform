import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { normalizeCatalogSlug } from "@/lib/catalog-slug";
import { normalizeSupportedProfilesList } from "@/lib/profile-options";
import { validateScenarioProfileSelection } from "@/lib/scenario-profile-validation";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional().default(""),
  description: z.string().min(1),
  longDescription: z.string().optional().nullable(),
  publishStatus: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string()).default([]),
  supportedProfiles: z.array(z.string()).default([]),
  recommendedIdes: z.array(z.string()).default([]),
  entryRoleId: z.string().nullable().optional(),
  isFeatured: z.boolean().default(false),
  roles: z.array(z.object({ id: z.string().min(1), isOptional: z.boolean().default(false) })).default([]),
  skills: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  roleIds: z.array(z.string()).default([]),
  skillIds: z.array(z.string()).default([]),
  ruleIds: z.array(z.string()).default([]),
  domainIds: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const items = await prisma.scenarioPackage.findMany({
      include: {
        roles: { orderBy: { sortOrder: "asc" } },
        skills: { orderBy: { sortOrder: "asc" } },
        rules: { orderBy: { sortOrder: "asc" } },
        domainLinks: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk({ items });
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;
    const supportedProfiles = normalizeSupportedProfilesList(b.supportedProfiles);
    if (supportedProfiles.invalid.length > 0) {
      return jsonErr(`存在不支持的 Profile：${supportedProfiles.invalid.join("、")}`, 400);
    }
    if (supportedProfiles.profiles.length === 0) {
      return jsonErr("场景 supportedProfiles 不能为空，请至少选择一个 profile。", 400);
    }

    const slug = normalizeCatalogSlug(b.slug || b.name, "scenario");
    const roleEntries =
      b.roles.length > 0
        ? b.roles
        : b.roleIds.map((id) => ({ id, isOptional: false }));
    const skillIds = b.skills.length > 0 ? b.skills : b.skillIds;
    const ruleIds = b.rules.length > 0 ? b.rules : b.ruleIds;

    const profileValidationError = await validateScenarioProfileSelection({
      supportedProfiles: supportedProfiles.profiles,
      entryRoleId: b.entryRoleId || null,
      roleIds: roleEntries.map((role) => role.id),
      skillIds,
      ruleIds,
    });
    if (profileValidationError) {
      return jsonErr(profileValidationError, 400);
    }

    try {
      const scenario = await prisma.$transaction(async (tx) => {
        const created = await tx.scenarioPackage.create({
          data: {
            name: b.name.trim(),
            slug,
            description: b.description.trim(),
            longDescription: b.longDescription?.trim() || null,
            publishStatus: b.publishStatus,
            tags: b.tags,
            supportedProfiles: supportedProfiles.profiles,
            recommendedIdes: b.recommendedIdes,
            entryRoleId: b.entryRoleId || null,
            isFeatured: b.isFeatured,
          },
        });

        if (roleEntries.length > 0) {
          await tx.scenarioPackageRole.createMany({
            data: roleEntries.map((role, index) => ({
              scenarioPackageId: created.id,
              roleId: role.id,
              sortOrder: index,
              isOptional: role.isOptional,
            })),
          });
        }
        if (skillIds.length > 0) {
          await tx.scenarioPackageSkill.createMany({
            data: skillIds.map((skillId, index) => ({
              scenarioPackageId: created.id,
              skillId,
              sortOrder: index,
            })),
          });
        }
        if (ruleIds.length > 0) {
          await tx.scenarioPackageRule.createMany({
            data: ruleIds.map((ruleId, index) => ({
              scenarioPackageId: created.id,
              ruleId,
              sortOrder: index,
            })),
          });
        }
        if (b.domainIds.length > 0) {
          await tx.scenarioDomainLink.createMany({
            data: b.domainIds.map((domainId) => ({
              scenarioPackageId: created.id,
              domainId,
            })),
          });
        }

        return created;
      });

      return jsonOk({ scenario }, "已创建");
    } catch (e: unknown) {
      const unique = e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
      if (unique) {
        return jsonErr("名称或 Slug 已存在", 400);
      }
      throw e;
    }
  } catch (e) {
    return toApiResponse(e);
  }
}
