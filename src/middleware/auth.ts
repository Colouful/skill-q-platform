import { jsonErr } from "@/lib/api-response";
import {
  findAgentByApiKeyRaw,
  findAgentBySessionCookie,
  getAuthFromRequest,
  SESSION_COOKIE,
  type AuthAgent,
} from "@/lib/agent-auth";

export type AuthContext = {
  agent: AuthAgent | null;
  apiKeyId?: string;
  sessionId?: string;
  mode?: "bearer" | "cookie";
};

/** 与 Route Handler 中 `getAuthFromRequest` 等价（可选认证） */
export async function optionalAuth(req: Request): Promise<AuthContext> {
  const r = await getAuthFromRequest(req);
  if (!r.agent) {
    return { agent: null };
  }
  return {
    agent: r.agent,
    apiKeyId: r.apiKeyId,
    sessionId: "sessionId" in r ? r.sessionId : undefined,
    mode: r.mode,
  };
}

export type RequireAuthResult =
  | {
      success: true;
      agent: AuthAgent;
      apiKeyId: string;
      sessionId?: string;
      mode: "bearer" | "cookie";
    }
  | { success: false; response: ReturnType<typeof jsonErr> };

/** 未登录返回 `success: false` + 401 Response */
export async function requireAuth(req: Request): Promise<RequireAuthResult> {
  const r = await getAuthFromRequest(req);
  if (!r.agent) {
    return { success: false, response: jsonErr("未登录", 401) };
  }
  if (r.mode === "bearer") {
    return {
      success: true,
      agent: r.agent,
      apiKeyId: r.apiKeyId as string,
      mode: "bearer",
    };
  }
  return {
    success: true,
    agent: r.agent,
    apiKeyId: r.apiKeyId as string,
    sessionId: r.sessionId as string,
    mode: "cookie",
  };
}

export function authenticateApiKey(rawKey: string) {
  return findAgentByApiKeyRaw(rawKey.trim());
}

export function getSessionFromCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${SESSION_COOKIE}=`)) {
      return decodeURIComponent(p.slice(SESSION_COOKIE.length + 1));
    }
  }
  return undefined;
}

export async function sessionFromRequestHeaders(req: Request) {
  const sid = getSessionFromCookie(req.headers.get("cookie"));
  return findAgentBySessionCookie(sid);
}
