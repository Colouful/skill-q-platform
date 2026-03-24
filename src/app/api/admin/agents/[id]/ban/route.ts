import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { requireAdminJson } from "@/lib/admin-api-route";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requireAdminJson(req);
    if (!gate.ok) return gate.response;

    const { id } = await ctx.params;
    const existing = await prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      return jsonErr("用户不存在", 404);
    }
    if (!existing.isActive) {
      return jsonErr("该账号已处于封禁状态", 400);
    }

    await prisma.agent.update({
      where: { id },
      data: { isActive: false },
    });

    return jsonOk({ id }, "已封禁");
  } catch (e) {
    return toApiResponse(e);
  }
}
