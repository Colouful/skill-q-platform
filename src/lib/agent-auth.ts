import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Agent, ApiKey } from "@/generated/prisma";
import { isBlockedAgentId } from "@/lib/hub-blocklist";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "agent_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export { SESSION_COOKIE, SESSION_MS };

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** 明文 API Key，仅创建时返回一次 */
export function generateApiKey(): string {
  return `sk_${randomBytes(32).toString("hex")}`;
}

export function apiKeyPrefix(raw: string): string {
  return raw.length <= 24 ? raw : `${raw.slice(0, 24)}…`;
}

export function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

/** 默认头像（占位图，与像素 UI 一致；可后续换为龙虾静态资源） */
export function getDefaultAvatar(): string {
  return "/window.svg";
}

export function identifyAgentType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("openclaw")) return "openclaw";
  if (ua.includes("codex")) return "codex";
  if (ua.includes("claude")) return "claude";
  if (ua.includes("gpt") || ua.includes("openai")) return "gpt";
  return "unknown";
}

export type AuthAgent = Pick<
  Agent,
  | "id"
  | "name"
  | "slug"
  | "avatar"
  | "level"
  | "levelName"
  | "agentType"
  | "isActive"
>;

export function publicAgentSummary(agent: AuthAgent) {
  return {
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    level: agent.level,
    levelName: agent.levelName,
  };
}

const apiKeyLookupCache = new Map<
  string,
  { at: number; value: { apiKey: ApiKey & { agent: Agent }; agent: Agent } | null }
>();
const API_KEY_CACHE_TTL_MS = 60_000;
const API_KEY_CACHE_MAX = 500;

export async function findAgentByApiKeyRaw(raw: string) {
  const keyHash = hashApiKey(raw.trim());
  const now = Date.now();
  const cached = apiKeyLookupCache.get(keyHash);
  if (cached && now - cached.at < API_KEY_CACHE_TTL_MS) {
    return cached.value;
  }

  const row = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isRevoked: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { agent: true },
  });
  if (!row?.agent?.isActive) {
    apiKeyLookupCache.set(keyHash, { at: now, value: null });
    trimApiKeyCache();
    return null;
  }
  if (isBlockedAgentId(row.agent.id)) {
    apiKeyLookupCache.set(keyHash, { at: now, value: null });
    trimApiKeyCache();
    return null;
  }
  const value = { apiKey: row, agent: row.agent };
  apiKeyLookupCache.set(keyHash, { at: now, value });
  trimApiKeyCache();
  return value;
}

function trimApiKeyCache() {
  if (apiKeyLookupCache.size <= API_KEY_CACHE_MAX) return;
  const drop = apiKeyLookupCache.size - API_KEY_CACHE_MAX + 50;
  let i = 0;
  for (const k of apiKeyLookupCache.keys()) {
    apiKeyLookupCache.delete(k);
    if (++i >= drop) break;
  }
}

type ApiKeyWithAgent = ApiKey & { agent: Agent };

/** 登录专用：区分无效 / 已撤销 / 过期 / 账号禁用 */
export type ApiKeyLoginClass =
  | { ok: true; apiKey: ApiKeyWithAgent; agent: Agent }
  | { ok: false; reason: "invalid" | "revoked" | "expired" | "inactive_agent" | "blocked" };

export async function classifyApiKeyForLogin(raw: string): Promise<ApiKeyLoginClass> {
  const keyHash = hashApiKey(raw.trim());
  const row = await prisma.apiKey.findFirst({
    where: { keyHash },
    include: { agent: true },
  });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.isRevoked) return { ok: false, reason: "revoked" };
  if (row.expiresAt && row.expiresAt <= new Date()) return { ok: false, reason: "expired" };
  if (!row.agent.isActive) return { ok: false, reason: "inactive_agent" };
  if (isBlockedAgentId(row.agent.id)) return { ok: false, reason: "blocked" };
  return { ok: true, apiKey: row, agent: row.agent };
}

export async function findAgentBySessionCookie(sessionId: string | undefined) {
  if (!sessionId) return null;
  const session = await prisma.agentSession.findUnique({
    where: { sessionId },
    include: { agent: true, apiKey: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  if (!session.agent.isActive) return null;
  if (session.apiKey.isRevoked) return null;
  if (isBlockedAgentId(session.agent.id)) return null;
  return { session, agent: session.agent };
}

/** Cookie 或 Bearer，用于 Route Handlers（`Request` 即可，无需 NextRequest） */
export async function getAuthFromRequest(req: Request) {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) {
    const hit = await findAgentByApiKeyRaw(bearer);
    if (!hit) return { agent: null as AuthAgent | null };
    return {
      agent: hit.agent as AuthAgent,
      apiKeyId: hit.apiKey.id,
      mode: "bearer" as const,
    };
  }
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;
  const hit = await findAgentBySessionCookie(sid);
  if (!hit) return { agent: null as AuthAgent | null };
  return {
    agent: hit.agent as AuthAgent,
    apiKeyId: hit.session.apiKeyId,
    sessionId: hit.session.sessionId,
    mode: "cookie" as const,
  };
}
