import { prisma } from "@/lib/prisma";
import {
  applyExperienceDelta,
  AUTHOR_DOWNLOADS_PER_XP_CHUNK,
  XP_DOWNLOAD_MILESTONE,
} from "@/lib/agent-experience";
import { getAuthFromRequest } from "@/lib/agent-auth";
import { getRequestIp } from "@/lib/api-rate-limit";
import { assertDownloadAllowed } from "@/lib/download-policy";
import { isPublishedModeration } from "@/lib/moderation";
import { notifyResourceFirstDownload } from "@/lib/hub-notifications";

function clip(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

export async function executeSkillVersionDownload(slug: string, versionLabel: string, req: Request) {
  const auth = await getAuthFromRequest(req);
  const ip = clip(getRequestIp(req), 50);
  const ua = req.headers.get("user-agent");
  const userAgent = ua ? clip(ua, 500) : null;

  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      authorAgentId: true,
      downloadPolicy: true,
      moderationStatus: true,
    },
  });
  if (!skill) {
    return { ok: false as const, status: 404, message: "Skill 不存在" };
  }

  const gate = assertDownloadAllowed(skill.downloadPolicy, auth.agent, skill.authorAgentId);
  if (!gate.ok) {
    return { ok: false as const, status: gate.status, message: gate.message };
  }

  if (!isPublishedModeration(skill.moderationStatus)) {
    const isAuthor = auth.agent?.id && skill.authorAgentId && auth.agent.id === skill.authorAgentId;
    if (!isAuthor) {
      return { ok: false as const, status: 403, message: "资源未上架或不可下载" };
    }
  }

  const existing = await prisma.version.findUnique({
    where: {
      skillId_version: { skillId: skill.id, version: versionLabel },
    },
  });
  if (!existing) {
    return { ok: false as const, status: 404, message: "版本不存在" };
  }

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

    await tx.downloadLog.create({
      data: {
        agentId: auth.agent?.id ?? null,
        resourceType: "skill",
        resourceId: skill.id,
        ipAddress: ip,
        userAgent,
      },
    });

    return { version, skillDownloads: skillRow.downloads };
  });

  if (skill.authorAgentId && result.version.downloads === 1) {
    const selfDownload = auth.agent?.id === skill.authorAgentId;
    if (!selfDownload) {
      void notifyResourceFirstDownload(
        skill.authorAgentId,
        "skill",
        skill.name,
        versionLabel,
      ).catch(() => {});
    }
  }

  return { ok: true as const, ...result };
}
