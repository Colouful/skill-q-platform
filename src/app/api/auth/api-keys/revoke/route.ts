import type { NextRequest } from "next/server";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** POST { id } 撤销 Key */
export async function POST(req: NextRequest) {
  try {
    const { agent } = await getAuthFromRequest(req);
    if (!agent) {
      return jsonErr("未登录", 401);
    }

    let body: { id?: string } = {};
    try {
      body = (await req.json()) as { id?: string };
    } catch {
      return jsonErr("请求体须为 JSON", 400);
    }

    const id = body.id?.trim();
    if (!id) {
      return jsonErr("缺少 id", 400);
    }

    const row = await prisma.apiKey.findFirst({
      where: { id, agentId: agent.id },
    });
    if (!row) {
      return jsonErr("未找到 Key", 404);
    }

    await prisma.apiKey.update({
      where: { id: row.id },
      data: { isRevoked: true },
    });

    return jsonOk({ ok: true });
  } catch (e) {
    return toApiResponse(e);
  }
}
