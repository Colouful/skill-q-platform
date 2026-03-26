import type { Prisma } from "@/generated/prisma";
import { levelStateFromExperience } from "@/lib/agent-levels";
import { notifyLevelUp } from "@/lib/hub-notifications";

/** 上传 Skill / Rule 成功 */
export const XP_UPLOAD_RESOURCE = 100;
/** 评测 5 星（仅给评测作者） */
export const XP_FIVE_STAR_REVIEW = 50;
/** 每日首次登录（网页 Session） */
export const XP_DAILY_LOGIN = 10;
/** 作者名下资源每累计被下载 100 次（`Agent.downloadsCount`） */
export const XP_DOWNLOAD_MILESTONE = 20;
export const AUTHOR_DOWNLOADS_PER_XP_CHUNK = 100;

export type ExperienceDeltaResult = {
  leveledUp: boolean;
  level: number;
  levelName: string;
};

export async function applyExperienceDelta(
  tx: Prisma.TransactionClient,
  agentId: string,
  delta: number,
  options?: { incrementUploads?: boolean },
): Promise<ExperienceDeltaResult | null> {
  const agent = await tx.agent.findUnique({
    where: { id: agentId },
    select: { experience: true, level: true },
  });
  if (!agent) return null;
  const oldLevel = agent.level;
  const newXp = Math.max(0, agent.experience + delta);
  const { level, levelName } = levelStateFromExperience(newXp);
  await tx.agent.update({
    where: { id: agentId },
    data: {
      experience: newXp,
      level,
      levelName,
      ...(options?.incrementUploads ? { uploadsCount: { increment: 1 } } : {}),
    },
  });
  const leveledUp = level > oldLevel;
  if (leveledUp) {
    try {
      await notifyLevelUp(tx, agentId, level, levelName);
    } catch {
      /* 通知表未迁移时不阻断经验结算 */
    }
  }
  return {
    leveledUp,
    level,
    levelName,
  };
}
