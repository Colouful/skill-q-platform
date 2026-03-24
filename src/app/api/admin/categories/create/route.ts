import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { logCategoryAudit } from "@/lib/category-audit";
import { normalizeCategorySlug } from "@/lib/category-slug";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
  description: z.string().max(5000).optional().nullable(),
  icon: z.string().max(255).optional().nullable(),
  resourceType: z.enum(["skill", "rule"]),
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
    const slug = normalizeCategorySlug(b.slug);
    if (!slug) {
      return jsonErr("slug 无效", 400);
    }

    const name = b.name.trim();
    const maxRow = await prisma.category.findFirst({
      where: { resourceType: b.resourceType },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = b.sortOrder ?? (maxRow ? maxRow.sortOrder + 1 : 0);

    try {
      const cat = await prisma.category.create({
        data: {
          name,
          slug,
          description: b.description?.trim() || null,
          icon: b.icon?.trim() || null,
          resourceType: b.resourceType,
          sortOrder,
        },
      });
      await logCategoryAudit(gate.admin.id, "create", cat.id, { slug, name, resourceType: b.resourceType });
      return jsonOk({ category: cat }, "已创建");
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
      if (msg) {
        return jsonErr("同类型下名称或 Slug 已存在", 400);
      }
      throw e;
    }
  } catch (e) {
    return toApiResponse(e);
  }
}
