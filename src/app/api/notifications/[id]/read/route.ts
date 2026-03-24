import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth.agent) {
      return jsonErr("请先登录", 401);
    }

    const { id } = await ctx.params;
    const row = await prisma.hubNotification.findFirst({
      where: { id, agentId: auth.agent.id },
    });
    if (!row) {
      return jsonErr("通知不存在", 404);
    }
    if (row.isRead) {
      return jsonOk({ id }, "已是已读");
    }

    await prisma.hubNotification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return jsonOk({ id }, "已读");
  } catch (e) {
    return toApiResponse(e);
  }
}
