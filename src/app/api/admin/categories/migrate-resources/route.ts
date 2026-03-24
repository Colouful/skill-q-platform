import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { logCategoryAudit } from "@/lib/category-audit";
import type { ResourceTypeFilter } from "@/lib/admin-category";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  fromCategoryId: z.string().min(1),
  toCategoryId: z.string().min(1),
  resourceType: z.enum(["skill", "rule"]),
  /** 为 false 时迁移后删除空分类 */
  keepSourceCategory: z.boolean().default(false),
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
    const { fromCategoryId, toCategoryId, resourceType, keepSourceCategory } = parsed.data;

    if (fromCategoryId === toCategoryId) {
      return jsonErr("源与目标不能相同", 400);
    }

    const [from, to] = await Promise.all([
      prisma.category.findUnique({ where: { id: fromCategoryId } }),
      prisma.category.findUnique({ where: { id: toCategoryId } }),
    ]);
    if (!from || !to || from.resourceType !== resourceType || to.resourceType !== resourceType) {
      return jsonErr("分类不存在或资源类型不一致", 400);
    }

    const rt = resourceType as ResourceTypeFilter;
    let moved = 0;

    await prisma.$transaction(async (tx) => {
      if (rt === "skill") {
        const r = await tx.skill.updateMany({
          where: { categoryId: fromCategoryId },
          data: { categoryId: toCategoryId },
        });
        moved = r.count;
      } else {
        const r = await tx.rule.updateMany({
          where: { categoryId: fromCategoryId },
          data: { categoryId: toCategoryId },
        });
        moved = r.count;
      }
      if (!keepSourceCategory) {
        await tx.category.delete({ where: { id: fromCategoryId } });
      }
    });

    await logCategoryAudit(gate.admin.id, "migrate-resources", fromCategoryId, {
      toCategoryId,
      moved,
      resourceType,
      keepSourceCategory,
    });
    return jsonOk({ moved, sourceCategoryDeleted: !keepSourceCategory }, "迁移完成");
  } catch (e) {
    return toApiResponse(e);
  }
}
