import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  try {
    const auth = await getAuthFromRequest(_req);
    if (!auth.agent) {
      return jsonErr("请先登录", 401);
    }

    const count = await prisma.hubNotification.count({
      where: { agentId: auth.agent.id, isRead: false },
    });

    return jsonOk({ count });
  } catch (e) {
    return toApiResponse(e);
  }
}
