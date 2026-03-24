import { getAuthFromRequest } from "@/lib/agent-auth";
import { ApiError } from "@/lib/api-errors";
import {
  assertHubAuthForResourceAuthor,
  isHubAdmin,
  isHubAuthEnabled,
} from "@/lib/hub-auth";

/** 服务端页面：当前登录用户是否可编辑该 Skill/Rule（与 API `assertSkillRuleWriteAccess` 对齐） */
export function canEditSkillOrRule(
  viewer: { id: string; name: string } | null | undefined,
  authorAgentId: string | null,
  authorDisplay: string,
): boolean {
  if (!viewer) return false;
  if (authorAgentId) return viewer.id === authorAgentId;
  return viewer.name.trim() === authorDisplay.trim();
}

/**
 * 写操作：优先用 `authorAgentId` 绑定特工；无绑定时的旧数据在 HUB_AUTH 开启时走 X-Hub-Actor；
 * 否则要求登录且档案昵称与 `author` 展示字符串一致。
 */
export async function assertSkillRuleWriteAccess(
  req: Request,
  existing: { authorAgentId: string | null; author: string },
): Promise<void> {
  if (isHubAdmin(req)) return;

  const auth = await getAuthFromRequest(req);
  if (!auth.agent) {
    throw new ApiError("需要登录", 401);
  }

  if (existing.authorAgentId) {
    if (auth.agent.id !== existing.authorAgentId) {
      throw new ApiError("无权操作（仅作者或管理员）", 403);
    }
    return;
  }

  if (isHubAuthEnabled()) {
    assertHubAuthForResourceAuthor(req, existing.author);
    return;
  }

  if (auth.agent.name.trim() !== existing.author.trim()) {
    throw new ApiError("无权操作（仅作者或管理员）", 403);
  }
}
