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
  resourceIds: z.array(z.string()).min(1).max(500),
  targetCategoryId: z.string().min(1),
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
    const { resourceType, resourceIds, targetCategoryId } = parsed.data;

    const target = await prisma.category.findUnique({ where: { id: targetCategoryId } });
    if (!target || target.resourceType !== resourceType) {
      return jsonErr("目标分类不存在或资源类型不一致", 400);
    }

    const rt = resourceType as ResourceTypeFilter;
    let success = 0;
    let failed = 0;
    const errors: { id: string; error: string }[] = [];

    if (rt === "skill") {
      for (const id of resourceIds) {
        try {
          await prisma.skill.update({
            where: { id },
            data: { categoryId: targetCategoryId },
          });
          success += 1;
        } catch {
          failed += 1;
          errors.push({ id, error: "更新失败或不存在" });
        }
      }
    } else {
      for (const id of resourceIds) {
        try {
          await prisma.rule.update({
            where: { id },
            data: { categoryId: targetCategoryId },
          });
          success += 1;
        } catch {
          failed += 1;
          errors.push({ id, error: "更新失败或不存在" });
        }
      }
    }

    await logCategoryAudit(gate.admin.id, "bulk-update-category", targetCategoryId, {
      resourceType,
      success,
      failed,
      sampleErrors: errors.slice(0, 20),
    });

    return jsonOk({ success, failed, errors }, "处理完成");
  } catch (e) {
    return toApiResponse(e);
  }
}
