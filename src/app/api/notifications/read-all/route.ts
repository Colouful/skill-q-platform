import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth.agent) {
      return jsonErr("请先登录", 401);
    }

    const now = new Date();
    const r = await prisma.hubNotification.updateMany({
      where: { agentId: auth.agent.id, isRead: false },
      data: { isRead: true, readAt: now },
    });

    return jsonOk({ updated: r.count }, "已全部标为已读");
  } catch (e) {
    return toApiResponse(e);
  }
}
