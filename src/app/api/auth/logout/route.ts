import { cookies } from "next/headers";
import { jsonOk } from "@/lib/api-response";
import { toApiResponse } from "@/lib/api-errors";
import { SESSION_COOKIE, findAgentBySessionCookie } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    const hit = await findAgentBySessionCookie(sid);
    if (hit) {
      await prisma.agentSession.deleteMany({ where: { sessionId: hit.session.sessionId } });
    }
    cookieStore.delete(SESSION_COOKIE);
    return jsonOk({ ok: true });
  } catch (e) {
    return toApiResponse(e);
  }
}
