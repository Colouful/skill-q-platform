import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { normalizeCatalogSlug } from "@/lib/catalog-slug";
import { ROLE_STATUS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  slug: z.string().optional().default(""),
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

    try {
      const role = await prisma.$transaction(async (tx) => {
        const updated = await tx.roleTemplate.update({
          where: { id: b.id },
          data: {
            name: b.name.trim(),
            slug,
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

        await tx.roleSkillLink.deleteMany({ where: { roleId: updated.id } });
        await tx.roleRuleLink.deleteMany({ where: { roleId: updated.id } });
        await tx.roleDomainLink.deleteMany({ where: { roleId: updated.id } });

        if (b.skillIds.length > 0) {
          await tx.roleSkillLink.createMany({
            data: b.skillIds.map((skillId, index) => ({
              roleId: updated.id,
              skillId,
              sortOrder: index,
            })),
          });
        }
        if (b.ruleIds.length > 0) {
          await tx.roleRuleLink.createMany({
            data: b.ruleIds.map((ruleId, index) => ({
              roleId: updated.id,
              ruleId,
              sortOrder: index,
            })),
          });
        }
        if (b.domainIds.length > 0) {
          await tx.roleDomainLink.createMany({
            data: b.domainIds.map((domainId) => ({
              roleId: updated.id,
              domainId,
            })),
          });
        }

        return updated;
      });

      return jsonOk({ role }, "已更新");
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
