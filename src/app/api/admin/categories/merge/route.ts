import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { logCategoryAudit } from "@/lib/category-audit";
import type { ResourceTypeFilter } from "@/lib/admin-category";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  resourceType: z.enum(["skill", "rule"]),
  sourceCategoryIds: z.array(z.string()).min(1),
  targetCategoryId: z.string().min(1),
  deleteSources: z.boolean().default(true),
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
    const { resourceType, sourceCategoryIds, targetCategoryId, deleteSources } = parsed.data;

    const target = await prisma.category.findUnique({ where: { id: targetCategoryId } });
    if (!target || target.resourceType !== resourceType) {
      return jsonErr("目标分类不存在或资源类型不一致", 400);
    }

    const sources = [...new Set(sourceCategoryIds)].filter((id) => id !== targetCategoryId);
    if (sources.length === 0) {
      return jsonErr("请至少选择一个源分类（可与目标不同）", 400);
    }

    const rt = resourceType as ResourceTypeFilter;
    for (const sid of sources) {
      const s = await prisma.category.findUnique({ where: { id: sid } });
      if (!s || s.resourceType !== resourceType) {
        return jsonErr(`源分类无效: ${sid}`, 400);
      }
    }

    let moved = 0;

    await prisma.$transaction(async (tx) => {
      for (const sid of sources) {
        if (rt === "skill") {
          const c = await tx.skill.updateMany({
            where: { categoryId: sid },
            data: { categoryId: targetCategoryId },
          });
          moved += c.count;
        } else {
          const c = await tx.rule.updateMany({
            where: { categoryId: sid },
            data: { categoryId: targetCategoryId },
          });
          moved += c.count;
        }
        if (deleteSources) {
          await tx.category.delete({ where: { id: sid } });
        }
      }
    });

    await logCategoryAudit(gate.admin.id, "merge", targetCategoryId, {
      resourceType,
      sources,
      deleteSources,
      moved,
    });
    return jsonOk({ moved, deletedSources: deleteSources }, "合并完成");
  } catch (e) {
    return toApiResponse(e);
  }
}
