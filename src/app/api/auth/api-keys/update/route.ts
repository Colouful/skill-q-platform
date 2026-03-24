import type { NextRequest } from "next/server";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).nullable().optional(),
});

/** 更新 API Key 名称/描述（任务书 PUT；项目约定仅 GET/POST，故用 POST） */
export async function POST(req: NextRequest) {
  try {
    const { agent } = await getAuthFromRequest(req);
    if (!agent) {
      return jsonErr("未登录", 401);
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return jsonErr("请求体须为 JSON", 400);
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return jsonErr(parsed.error.issues.map((i) => i.message).join("; "), 400);
    }
    const b = parsed.data;

    const row = await prisma.apiKey.findFirst({
      where: { id: b.id, agentId: agent.id },
    });
    if (!row) {
      return jsonErr("Key 不存在", 404);
    }
    if (row.isRevoked) {
      return jsonErr("已撤销的 Key 无法修改", 400);
    }

    const data: { name?: string; description?: string | null } = {};
    if (b.name !== undefined) data.name = b.name.trim();
    if (b.description !== undefined) data.description = b.description?.trim() || null;

    if (Object.keys(data).length === 0) {
      return jsonErr("请提供 name 或 description", 400);
    }

    const updated = await prisma.apiKey.update({
      where: { id: row.id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        keyPrefix: true,
        updatedAt: true,
      },
    });

    return jsonOk({ key: updated });
  } catch (e) {
    return toApiResponse(e);
  }
}
