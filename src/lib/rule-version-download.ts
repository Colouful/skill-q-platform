import { prisma } from "@/lib/prisma";
import {
  applyExperienceDelta,
  AUTHOR_DOWNLOADS_PER_XP_CHUNK,
  XP_DOWNLOAD_MILESTONE,
} from "@/lib/agent-experience";

/** 记录 Rule 版本下载并递增 Rule 总下载量 */
export async function bumpRuleVersionDownloads(slug: string, versionLabel: string) {
  const rule = await prisma.rule.findUnique({
    where: { slug },
    select: { id: true, authorAgentId: true },
  });
  if (!rule) return null;

  const existing = await prisma.ruleVersion.findUnique({
    where: {
      ruleId_version: { ruleId: rule.id, version: versionLabel },
    },
  });
  if (!existing) return null;

  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.ruleVersion.update({
      where: { id: existing.id },
      data: { downloads: { increment: 1 } },
    });
    const ruleRow = await tx.rule.update({
      where: { id: rule.id },
      data: { downloads: { increment: 1 } },
    });

    if (rule.authorAgentId) {
      const agentRow = await tx.agent.update({
        where: { id: rule.authorAgentId },
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

    return { version, ruleDownloads: ruleRow.downloads };
  });

  return result;
}
