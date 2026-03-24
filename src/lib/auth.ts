/**
 * 认证工具（任务书命名 `auth.ts`；实现见 `agent-auth.ts`）
 */
export {
  SESSION_COOKIE,
  SESSION_MS,
  apiKeyPrefix,
  findAgentByApiKeyRaw,
  findAgentBySessionCookie,
  generateApiKey,
  generateSessionId,
  getAuthFromRequest,
  getDefaultAvatar,
  hashApiKey,
  identifyAgentType,
  publicAgentSummary,
  type AuthAgent,
} from "@/lib/agent-auth";
