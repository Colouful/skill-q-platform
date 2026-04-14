import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { normalizeCatalogSlug } from "@/lib/catalog-slug";
import { normalizeRegistryLikeId } from "@/lib/hub-registry-contract";
import { assertUniqueRegistryFields } from "@/lib/registry-id-validation";
import { buildRoleVersionFiles } from "@/lib/role-version";
import { ROLE_STATUS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional().default(""),
  registryId: z.string().min(1).max(255).nullable().optional(),
  manifestId: z.string().min(1).max(255).nullable().optional(),
  author: z.string().min(1).max(100),
  description: z.string().min(1),
  longDescription: z.string().optional().nullable(),
  publishStatus: z.enum(["draft", "published"]).default("draft"),
  roleStatus: z.enum([ROLE_STATUS.DRAFT, ROLE_STATUS.ACTIVE, ROLE_STATUS.PLANNED]).default(ROLE_STATUS.DRAFT),
  tags: z.array(z.string()).default([]),
  supportedProfiles: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  reads: z.array(z.string()).default([]),
  writes: z.array(z.string()).default([]),
  handoffTo: z.array(z.string()).default([]),
  rolePositioning: z.string().optional().nullable(),
  workingPrinciples: z.array(z.string()).default([]),
  requiredSteps: z.array(z.string()).default([]),
  executionContract: z.string().optional().nullable(),
  outputStandard: z.string().optional().nullable(),
  prohibitedActions: z.array(z.string()).default([]),
  handoffNotes: z.string().optional().nullable(),
  skillIds: z.array(z.string()).default([]),
  ruleIds: z.array(z.string()).default([]),
  domainIds: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const items = await prisma.roleTemplate.findMany({
      include: {
        skillLinks: { orderBy: { sortOrder: "asc" } },
        ruleLinks: { orderBy: { sortOrder: "asc" } },
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
    const slug = normalizeCatalogSlug(b.slug || b.name, "role");
    const registryId =
      b.registryId === undefined
        ? null
        : b.registryId === null
          ? null
          : normalizeRegistryLikeId(b.registryId);
    if (b.registryId !== undefined && b.registryId !== null && !registryId) {
      return jsonErr("registryId 仅支持小写字母、数字、点、下划线和中划线", 400);
    }
    const manifestId =
      b.manifestId === undefined
        ? null
        : b.manifestId === null
          ? null
          : normalizeRegistryLikeId(b.manifestId);
    if (b.manifestId !== undefined && b.manifestId !== null && !manifestId) {
      return jsonErr("manifestId 仅支持小写字母、数字、点、下划线和中划线", 400);
    }

    const duplicateIssues = await assertUniqueRegistryFields({
      resourceType: "role",
      registryId: registryId ?? slug,
      manifestId: manifestId ?? registryId ?? slug,
    });
    if (duplicateIssues.length > 0) {
      return jsonErr(duplicateIssues.join("；"), 409);
    }

    try {
      const role = await prisma.$transaction(async (tx) => {
        const [skills, rules, domains] = await Promise.all([
          b.skillIds.length > 0
            ? tx.skill.findMany({
                where: { id: { in: b.skillIds } },
                select: { slug: true },
              })
            : Promise.resolve([]),
          b.ruleIds.length > 0
            ? tx.rule.findMany({
                where: { id: { in: b.ruleIds } },
                select: { slug: true },
              })
            : Promise.resolve([]),
          b.domainIds.length > 0
            ? tx.capabilityDomain.findMany({
                where: { id: { in: b.domainIds } },
                select: { slug: true },
              })
            : Promise.resolve([]),
        ]);

        const created = await tx.roleTemplate.create({
          data: {
            name: b.name.trim(),
            slug,
            registryId: registryId ?? null,
            manifestId: manifestId ?? null,
            author: b.author.trim(),
            description: b.description.trim(),
            longDescription: b.longDescription?.trim() || null,
            publishStatus: b.publishStatus,
            roleStatus: b.roleStatus,
            tags: b.tags,
            supportedProfiles: b.supportedProfiles,
            triggers: b.triggers,
            preferredSkills: b.preferredSkills,
            reads: b.reads,
            writes: b.writes,
            handoffTo: b.handoffTo,
            rolePositioning: b.rolePositioning?.trim() || null,
            workingPrinciples: b.workingPrinciples,
            requiredSteps: b.requiredSteps,
            executionContract: b.executionContract?.trim() || null,
            outputStandard: b.outputStandard?.trim() || null,
            prohibitedActions: b.prohibitedActions,
            handoffNotes: b.handoffNotes?.trim() || null,
          },
        });

        if (b.skillIds.length > 0) {
          await tx.roleSkillLink.createMany({
            data: b.skillIds.map((skillId, index) => ({
              roleId: created.id,
              skillId,
              sortOrder: index,
            })),
          });
        }
        if (b.ruleIds.length > 0) {
          await tx.roleRuleLink.createMany({
            data: b.ruleIds.map((ruleId, index) => ({
              roleId: created.id,
              ruleId,
              sortOrder: index,
            })),
          });
        }
        if (b.domainIds.length > 0) {
          await tx.roleDomainLink.createMany({
            data: b.domainIds.map((domainId) => ({
              roleId: created.id,
              domainId,
            })),
          });
        }

        await tx.roleVersion.create({
          data: {
            roleId: created.id,
            version: "1.0.0",
            changelog: "初始版本",
            files: buildRoleVersionFiles({
              name: created.name,
              slug: created.slug,
              author: created.author,
              description: created.description,
              longDescription: created.longDescription,
              publishStatus: created.publishStatus,
              roleStatus: created.roleStatus,
              supportedProfiles: b.supportedProfiles,
              tags: b.tags,
              triggers: b.triggers,
              preferredSkills: b.preferredSkills,
              reads: b.reads,
              writes: b.writes,
              handoffTo: b.handoffTo,
              rolePositioning: created.rolePositioning,
              workingPrinciples: b.workingPrinciples,
              requiredSteps: b.requiredSteps,
              executionContract: created.executionContract,
              outputStandard: created.outputStandard,
              prohibitedActions: b.prohibitedActions,
              handoffNotes: created.handoffNotes,
              skillSlugs: skills.map((item) => item.slug),
              ruleSlugs: rules.map((item) => item.slug),
              domainSlugs: domains.map((item) => item.slug),
            }),
            isLatest: true,
          },
        });

        return created;
      });

      return jsonOk({ role }, "已创建");
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
