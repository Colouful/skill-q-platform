import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { logCategoryAudit } from "@/lib/category-audit";
import { normalizeCategorySlug } from "@/lib/category-slug";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  slug: z.string().min(1).max(50).optional(),
  description: z.string().max(5000).optional().nullable(),
  icon: z.string().max(255).optional().nullable(),
  sortOrder: z.number().int().optional(),
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

    const existing = await prisma.category.findUnique({ where: { id: b.id } });
    if (!existing) {
      return jsonErr("分类不存在", 404);
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string | null;
      icon?: string | null;
      sortOrder?: number;
    } = {};

    if (b.name !== undefined) data.name = b.name.trim();
    if (b.slug !== undefined) {
      const slug = normalizeCategorySlug(b.slug);
      if (!slug) return jsonErr("slug 无效", 400);
      data.slug = slug;
    }
    if (b.description !== undefined) data.description = b.description?.trim() || null;
    if (b.icon !== undefined) data.icon = b.icon?.trim() || null;
    if (b.sortOrder !== undefined) data.sortOrder = b.sortOrder;

    try {
      const category = await prisma.category.update({
        where: { id: b.id },
        data,
      });
      await logCategoryAudit(gate.admin.id, "update", category.id, {
        before: { name: existing.name, slug: existing.slug },
        after: data,
      });
      return jsonOk({ category }, "已保存");
    } catch (e: unknown) {
      const dup =
        e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
      if (dup) {
        return jsonErr("同类型下名称或 Slug 已存在", 400);
      }
      throw e;
    }
  } catch (e) {
    return toApiResponse(e);
  }
}
