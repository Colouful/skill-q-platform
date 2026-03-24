import { prisma } from "@/lib/prisma";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest } from "@/lib/agent-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth.agent) {
      return jsonErr("请先登录", 401);
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const { page, pageSize } = parsed.data;
    const skip = (page - 1) * pageSize;

    const [total, items] = await prisma.$transaction([
      prisma.hubNotification.count({ where: { agentId: auth.agent.id } }),
      prisma.hubNotification.findMany({
        where: { agentId: auth.agent.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
    ]);

    return jsonOk({ items, total, page, pageSize });
  } catch (e) {
    return toApiResponse(e);
  }
}
