import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { CATALOG_PUBLISH_STATUS } from "@/lib/catalog";
import { stringArrayFromJson } from "@/lib/catalog";
import { buildRoleVersionFiles, normalizeRoleVersionFiles } from "@/lib/role-version";

export const dynamic = "force-dynamic";

const fileEntry = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  content: z.string().optional(),
});

const postBody = z.object({
  version: z.string().min(1).max(20),
  changelog: z.string().optional(),
  files: z.array(fileEntry).default([]),
  downloadUrl: z.string().max(500).nullable().optional(),
  isLatest: z.boolean().optional(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const role = await prisma.roleTemplate.findUnique({
      where: { slug },
      select: { id: true, publishStatus: true },
    });
    if (!role) {
      return jsonErr("专家不存在", 404);
    }

    const versions = await prisma.roleVersion.findMany({
      where: { roleId: role.id },
      orderBy: { createdAt: "desc" },
    });

    const normalized = versions.map((item) => ({
      ...item,
      files: normalizeRoleVersionFiles(item.files),
    }));

    if (role.publishStatus !== CATALOG_PUBLISH_STATUS.PUBLISHED) {
      const gate = await requireAdminJson(req);
      if (!gate.ok) {
        return jsonErr("专家不存在", 404);
      }
    }

    return jsonOk(normalized);
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { slug } = await ctx.params;
    const role = await prisma.roleTemplate.findUnique({
      where: { slug },
      include: {
        skillLinks: { include: { skill: { select: { slug: true } } }, orderBy: { sortOrder: "asc" } },
        ruleLinks: { include: { rule: { select: { slug: true } } }, orderBy: { sortOrder: "asc" } },
        domainLinks: { include: { domain: { select: { slug: true } } } },
      },
    });
    if (!role) {
      return jsonErr("专家不存在", 404);
    }

    const raw = await req.json();
    const parsed = postBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;
    const ver = b.version.trim();
    const files =
      b.files.length > 0
        ? normalizeRoleVersionFiles(b.files)
        : buildRoleVersionFiles({
            name: role.name,
            slug: role.slug,
            author: role.author,
            description: role.description,
            longDescription: role.longDescription,
            publishStatus: role.publishStatus,
            roleStatus: role.roleStatus,
            supportedProfiles: stringArrayFromJson(role.supportedProfiles),
            tags: stringArrayFromJson(role.tags),
            triggers: stringArrayFromJson(role.triggers),
            preferredSkills: stringArrayFromJson(role.preferredSkills),
            reads: stringArrayFromJson(role.reads),
            writes: stringArrayFromJson(role.writes),
            handoffTo: stringArrayFromJson(role.handoffTo),
            rolePositioning: role.rolePositioning,
            workingPrinciples: stringArrayFromJson(role.workingPrinciples),
            requiredSteps: stringArrayFromJson(role.requiredSteps),
            executionContract: role.executionContract,
            outputStandard: role.outputStandard,
            prohibitedActions: stringArrayFromJson(role.prohibitedActions),
            handoffNotes: role.handoffNotes,
            skillSlugs: role.skillLinks.map((item) => item.skill.slug),
            ruleSlugs: role.ruleLinks.map((item) => item.rule.slug),
            domainSlugs: role.domainLinks.map((item) => item.domain.slug),
          });

    const dup = await prisma.roleVersion.findUnique({
      where: { roleId_version: { roleId: role.id, version: ver } },
    });
    if (dup) {
      return jsonErr("该版本号已存在", 400);
    }

    const wantLatest = b.isLatest !== false;

    const created = await prisma.$transaction(async (tx) => {
      if (wantLatest) {
        await tx.roleVersion.updateMany({
          where: { roleId: role.id },
          data: { isLatest: false },
        });
      }

      return tx.roleVersion.create({
        data: {
          roleId: role.id,
          version: ver,
          changelog: b.changelog?.trim() || null,
          files,
          downloadUrl: b.downloadUrl?.trim() || null,
          isLatest: wantLatest,
        },
      });
    });

    return jsonOk(created, "版本已创建");
  } catch (e) {
    return toApiResponse(e);
  }
}
