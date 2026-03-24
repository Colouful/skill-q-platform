import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { logCategoryAudit } from "@/lib/category-audit";
import { countCategoryResources } from "@/lib/admin-category";
import type { ResourceTypeFilter } from "@/lib/admin-category";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  categoryId: z.string().min(1),
  mode: z.enum(["rejectIfNotEmpty", "migrateFirst", "cascadeDeleteResources"]).default("rejectIfNotEmpty"),
  targetCategoryId: z.string().optional(),
  /** 级联删除资源时必须为 true */
  confirmCascade: z.boolean().optional(),
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
    const { categoryId, mode, targetCategoryId, confirmCascade } = parsed.data;

    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) {
      return jsonErr("分类不存在", 404);
    }

    const rt = cat.resourceType as ResourceTypeFilter;
    const n = await countCategoryResources(categoryId, rt);

    if (mode === "rejectIfNotEmpty") {
      if (n > 0) {
        return jsonErr(
          `该分类下仍有 ${n} 个${rt === "skill" ? "Skill" : "Rule"}，请先迁移资源或选择其它删除方式`,
          400,
        );
      }
      await prisma.category.delete({ where: { id: categoryId } });
      await logCategoryAudit(gate.admin.id, "remove", categoryId, { mode: "empty", resourceType: rt });
      return jsonOk({ deleted: true }, "已删除");
    }

    if (mode === "migrateFirst") {
      if (!targetCategoryId) {
        return jsonErr("请指定目标分类 targetCategoryId", 400);
      }
      if (targetCategoryId === categoryId) {
        return jsonErr("目标分类不能与当前相同", 400);
      }
      const target = await prisma.category.findUnique({ where: { id: targetCategoryId } });
      if (!target || target.resourceType !== cat.resourceType) {
        return jsonErr("目标分类不存在或资源类型不一致", 400);
      }

      await prisma.$transaction(async (tx) => {
        if (rt === "skill") {
          await tx.skill.updateMany({
            where: { categoryId },
            data: { categoryId: targetCategoryId },
          });
        } else {
          await tx.rule.updateMany({
            where: { categoryId },
            data: { categoryId: targetCategoryId },
          });
        }
        await tx.category.delete({ where: { id: categoryId } });
      });

      await logCategoryAudit(gate.admin.id, "remove", categoryId, {
        mode: "migrateFirst",
        targetCategoryId,
        movedCount: n,
        resourceType: rt,
      });
      return jsonOk({ deleted: true, migratedCount: n }, "已迁移并删除分类");
    }

    if (mode === "cascadeDeleteResources") {
      if (!confirmCascade) {
        return jsonErr("级联删除需设置 confirmCascade: true", 400);
      }
      await prisma.$transaction(async (tx) => {
        if (rt === "skill") {
          await tx.skill.deleteMany({ where: { categoryId } });
        } else {
          await tx.rule.deleteMany({ where: { categoryId } });
        }
        await tx.category.delete({ where: { id: categoryId } });
      });
      await logCategoryAudit(gate.admin.id, "remove", categoryId, {
        mode: "cascadeDeleteResources",
        deletedResourceCount: n,
        resourceType: rt,
      });
      return jsonOk({ deleted: true, deletedResourceCount: n }, "已级联删除资源与分类");
    }

    return jsonErr("未知模式", 400);
  } catch (e) {
    return toApiResponse(e);
  }
}
