import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";
import { logCategoryAudit } from "@/lib/category-audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  resourceType: z.enum(["skill", "rule"]),
  /** 从上到下期望的顺序（完整列表） */
  orderedIds: z.array(z.string()).min(1),
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
    const { resourceType, orderedIds } = parsed.data;

    const existing = await prisma.category.findMany({
      where: { resourceType },
      select: { id: true },
    });
    const set = new Set(existing.map((c) => c.id));
    if (existing.length !== orderedIds.length) {
      return jsonErr("orderedIds 数量须与该类型下分类数量一致", 400);
    }
    for (const id of orderedIds) {
      if (!set.has(id)) {
        return jsonErr("存在不属于该类型的分类 id", 400);
      }
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await logCategoryAudit(gate.admin.id, "reorder", null, { resourceType, orderedIds });
    return jsonOk({ ok: true }, "排序已更新");
  } catch (e) {
    return toApiResponse(e);
  }
}
