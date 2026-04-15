import { type Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest, publicAgentSummary } from "@/lib/agent-auth";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { ASCII_URL_SLUG } from "@/lib/catalog-slug";
import { isHubAdmin } from "@/lib/hub-auth";
import { normalizeRegistryLikeId } from "@/lib/hub-registry-contract";
import { normalizeSupportedProfilesList } from "@/lib/profile-options";
import { assertUniqueRegistryFields } from "@/lib/registry-id-validation";
import { assertSkillRuleWriteAccess } from "@/lib/skill-rule-write-access";
import { isPublishedModeration } from "@/lib/moderation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const downloadPolicyEnum = z.enum(["public", "login", "author"]);

const patchBody = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).optional(),
  registryId: z.string().min(1).max(255).nullable().optional(),
  manifestId: z.string().min(1).max(255).nullable().optional(),
  description: z.string().min(1).optional(),
  longDescription: z.string().nullable().optional(),
  author: z.string().min(1).max(100).optional(),
  categorySlug: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  supportedProfiles: z.array(z.string()).optional(),
  downloadPolicy: downloadPolicyEnum.optional(),
  /** 乐观锁：须与当前 Rule.updatedAt 的 ISO 时间一致 */
  expectedUpdatedAt: z.string().optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await getAuthFromRequest(req);
    const { slug } = await ctx.params;
    const rule = await prisma.rule.findUnique({
      where: { slug },
      include: {
        category: true,
        versions: { orderBy: { createdAt: "desc" } },
        reviews: {
          where: { resourceType: "rule" },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!rule) {
      return jsonErr("Rule 不存在", 404);
    }
    if (!isPublishedModeration(rule.moderationStatus)) {
      const isAuthor = auth.agent?.id && rule.authorAgentId === auth.agent.id;
      if (!isAuthor) {
        return jsonErr("Rule 不存在", 404);
      }
    }
    return jsonOk({
      ...rule,
      currentAgent: auth.agent ? publicAgentSummary(auth.agent) : null,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const existing = await prisma.rule.findUnique({ where: { slug } });
    if (!existing) {
      return jsonErr("Rule 不存在", 404);
    }

    const admin = isHubAdmin(req) ? { id: "hub-admin-secret" } : await getAdminFromRequest(req);
    if (!admin) {
      await assertSkillRuleWriteAccess(req, {
        authorAgentId: existing.authorAgentId,
        author: existing.author,
      });
    }

    const raw = await req.json();
    const parsed = patchBody.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    if (b.expectedUpdatedAt !== undefined) {
      const sent = Date.parse(b.expectedUpdatedAt);
      if (Number.isNaN(sent) || sent !== existing.updatedAt.getTime()) {
        return jsonErr("内容已被他人修改，请刷新后重试", 409);
      }
    }

    const data: Prisma.RuleUpdateInput = {};
    if (b.supportedProfiles !== undefined) {
      const supportedProfiles = normalizeSupportedProfilesList(b.supportedProfiles);
      if (supportedProfiles.invalid.length > 0) {
        return jsonErr(`存在不支持的 Profile：${supportedProfiles.invalid.join("、")}`, 400);
      }
      data.supportedProfiles = supportedProfiles.profiles;
    }
    if (b.name !== undefined) data.name = b.name.trim();
    if (b.registryId !== undefined) {
      if (b.registryId === null) {
        data.registryId = null;
      } else {
        const nextRegistryId = normalizeRegistryLikeId(b.registryId);
        if (!nextRegistryId) {
          return jsonErr("registryId 仅支持小写字母、数字、点、下划线和中划线", 400);
        }
        data.registryId = nextRegistryId;
      }
    }
    if (b.manifestId !== undefined) {
      if (b.manifestId === null) {
        data.manifestId = null;
      } else {
        const nextManifestId = normalizeRegistryLikeId(b.manifestId);
        if (!nextManifestId) {
          return jsonErr("manifestId 仅支持小写字母、数字、点、下划线和中划线", 400);
        }
        data.manifestId = nextManifestId;
      }
    }
    if (b.slug !== undefined) {
      const nextSlug = b.slug.trim().toLowerCase();
      if (!nextSlug) {
        return jsonErr("Slug 不能为空", 400);
      }
      if (!ASCII_URL_SLUG.test(nextSlug)) {
        return jsonErr("Slug 仅支持小写字母、数字、点、下划线和中划线", 400);
      }
      if (nextSlug !== existing.slug) {
        const conflict = await prisma.rule.findUnique({ where: { slug: nextSlug } });
        if (conflict) {
          return jsonErr("Slug 已存在", 409);
        }
        data.slug = nextSlug;
      }
    }
    if (b.description !== undefined) data.description = b.description;
    if (b.longDescription !== undefined) data.longDescription = b.longDescription;
    if (b.author !== undefined) data.author = b.author.trim();
    if (b.isFeatured !== undefined) data.isFeatured = b.isFeatured;
    if (b.tags !== undefined) {
      data.tags = b.tags.length ? b.tags : [];
    }
    if (b.downloadPolicy !== undefined) {
      data.downloadPolicy = b.downloadPolicy;
    }

    if (b.categorySlug !== undefined) {
      const cat = await prisma.category.findUnique({
        where: { slug_resourceType: { slug: b.categorySlug, resourceType: "rule" } },
      });
      if (!cat) {
        return jsonErr("分类不存在", 400);
      }
      data.category = { connect: { id: cat.id } };
    }

    const nextRegistryId =
      b.registryId === undefined
        ? existing.registryId
        : b.registryId === null
          ? null
          : normalizeRegistryLikeId(b.registryId);
    const nextManifestId =
      b.manifestId === undefined
        ? existing.manifestId
        : b.manifestId === null
          ? null
          : normalizeRegistryLikeId(b.manifestId);
    const registryFieldsChanged =
      nextRegistryId !== existing.registryId || nextManifestId !== existing.manifestId;
    if (registryFieldsChanged) {
      const duplicateIssues = await assertUniqueRegistryFields({
        resourceType: "rule",
        registryId: nextRegistryId,
        manifestId: nextManifestId,
        excludeId: existing.id,
      });
      if (duplicateIssues.length > 0) {
        return jsonErr(duplicateIssues.join("；"), 409);
      }
    }

    const rule = await prisma.rule.update({
      where: { slug: existing.slug },
      data,
      include: { category: true },
    });

    return jsonOk(rule, "更新成功");
  } catch (e) {
    return toApiResponse(e);
  }
}
