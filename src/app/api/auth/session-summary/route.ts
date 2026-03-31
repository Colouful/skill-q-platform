import type { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { getAuthFromRequest, SESSION_MS } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth.agent) {
      return jsonOk({ loggedIn: false, agent: null });
    }

    if (auth.mode === "cookie" && auth.sessionId) {
      const newExp = new Date(Date.now() + SESSION_MS);
      await prisma.agentSession.updateMany({
        where: { sessionId: auth.sessionId },
        data: { expiresAt: newExp },
      });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: auth.agent.id },
      select: {
        id: true,
        name: true,
        slug: true,
        avatar: true,
        level: true,
        levelName: true,
      },
    });

    return jsonOk({
      loggedIn: true,
      agent,
    });
  } catch (e) {
    return toApiResponse(e);
  }
}
