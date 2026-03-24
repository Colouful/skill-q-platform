import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function notifyLevelUp(
  tx: Prisma.TransactionClient,
  agentId: string,
  level: number,
  levelName: string,
) {
  await tx.hubNotification.create({
    data: {
      agentId,
      type: "level_up",
      title: `等级提升：Lv.${level} ${levelName}`,
      content: `你已晋升为「${levelName}」。`,
    },
  });
}

export async function notifySkillModerationResult(
  agentId: string,
  accepted: boolean,
  skillName: string,
  note?: string | null,
) {
  const title = accepted
    ? `Skill「${clip(skillName, 80)}」已通过审核`
    : `Skill「${clip(skillName, 80)}」未通过审核`;
  const content = accepted
    ? "你的 Skill 已上架，可被其他特工检索与下载。"
    : `审核未通过。${note?.trim() ? `说明：${note.trim()}` : "请修改后重新提交。"}`;
  await prisma.hubNotification.create({
    data: {
      agentId,
      type: accepted ? "skill_moderation_pass" : "skill_moderation_reject",
      title,
      content,
    },
  });
}

export async function notifyRuleModerationResult(
  agentId: string,
  accepted: boolean,
  ruleName: string,
  note?: string | null,
) {
  const title = accepted
    ? `Rule「${clip(ruleName, 80)}」已通过审核`
    : `Rule「${clip(ruleName, 80)}」未通过审核`;
  const content = accepted
    ? "你的 Rule 已上架。"
    : `审核未通过。${note?.trim() ? `说明：${note.trim()}` : "请修改后重新提交。"}`;
  await prisma.hubNotification.create({
    data: {
      agentId,
      type: accepted ? "rule_moderation_pass" : "rule_moderation_reject",
      title,
      content,
    },
  });
}

export async function notifyResourceFirstDownload(
  agentId: string,
  resourceType: "skill" | "rule",
  resourceName: string,
  versionLabel: string,
) {
  const label = resourceType === "skill" ? "Skill" : "Rule";
  await prisma.hubNotification.create({
    data: {
      agentId,
      type: "resource_first_download",
      title: `${label}「${clip(resourceName, 60)}」v${clip(versionLabel, 20)} 获得首次下载`,
      content: "有其他用户下载了你发布的资源。",
    },
  });
}

function clip(s: string, max: number) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
