import { prisma } from "@/lib/prisma";
import {
  applyExperienceDelta,
  AUTHOR_DOWNLOADS_PER_XP_CHUNK,
  XP_DOWNLOAD_MILESTONE,
} from "@/lib/agent-experience";

/** 记录版本下载并返回最新行（供 JSON 下载与 ZIP 导出共用） */
export async function bumpVersionDownloads(slug: string, versionLabel: string) {
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { id: true, authorAgentId: true },
  });
  if (!skill) return null;

  const existing = await prisma.version.findUnique({
    where: {
      skillId_version: { skillId: skill.id, version: versionLabel },
    },
  });
  if (!existing) return null;

  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.version.update({
      where: { id: existing.id },
      data: { downloads: { increment: 1 } },
    });
    const skillRow = await tx.skill.update({
      where: { id: skill.id },
      data: { downloads: { increment: 1 } },
    });

    if (skill.authorAgentId) {
      const agentRow = await tx.agent.update({
        where: { id: skill.authorAgentId },
        data: { downloadsCount: { increment: 1 } },
        select: { id: true, downloadsCount: true },
      });
      if (
        agentRow.downloadsCount > 0 &&
        agentRow.downloadsCount % AUTHOR_DOWNLOADS_PER_XP_CHUNK === 0
      ) {
        await applyExperienceDelta(tx, agentRow.id, XP_DOWNLOAD_MILESTONE);
      }
    }

    return { version, skillDownloads: skillRow.downloads };
  });

  return result;
}
