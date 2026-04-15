import Link from "next/link";
import { skillPath } from "@/lib/slug-url";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { getAdminFromSessionCookie } from "@/lib/admin-auth";
import { SkillVersionDownloadButton } from "@/components/skills/skill-version-download-button";
import { SkillVersionZipButton } from "@/components/skills/skill-version-zip-button";
import { SkillVersionFileExplorer } from "@/components/skills/skill-version-file-explorer";
import { parseVersionFilesJson } from "@/lib/skill-file-entries";
import { canViewUnpublishedResource } from "@/lib/moderation";

export const dynamic = "force-dynamic";

/** 8.2 版本详情 */
export default async function SkillVersionDetailPage({
  params,
}: {
  params: Promise<{ slug: string; ver: string }>;
}) {
  const { slug, ver } = await params;
  const versionLabel = decodeURIComponent(ver);

  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!skill) notFound();

  const viewer = await getOptionalAuthAgentFromCookies();
  const admin = await getAdminFromSessionCookie();
  const canView =
    Boolean(admin) ||
    canViewUnpublishedResource(skill.moderationStatus, skill.authorAgentId, viewer?.id ?? null);
  if (!canView) {
    notFound();
  }

  const row = await prisma.version.findUnique({
    where: {
      skillId_version: { skillId: skill.id, version: versionLabel },
    },
  });
  if (!row) notFound();

  const fileEntries = parseVersionFilesJson(row.files);

  return (
    <article className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/skills" className="hover:text-[var(--pixel-fg)]">
          Skills
        </Link>
        <span className="mx-1">/</span>
        <Link href={skillPath(skill.slug)} className="hover:text-[var(--pixel-fg)]">
          {skill.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">v{row.version}</span>
      </nav>

      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-accent)]">
          {skill.category.name}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)] sm:text-2xl">
          {skill.name}
          <span className="text-[var(--pixel-muted)]"> · </span>
          <span className="text-[var(--pixel-accent)]">v{row.version}</span>
        </h1>
        {row.isLatest && (
          <p className="mt-2 inline-block border-2 border-[var(--pixel-accent)] px-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
            latest
          </p>
        )}
      </header>

      <div className="flex flex-wrap items-start gap-4">
        <SkillVersionDownloadButton
          slug={skill.slug}
          versionLabel={row.version}
          downloadUrl={row.downloadUrl}
          initialVersionDownloads={row.downloads}
        />
        {/* 无外链时与「下载此版本」同为 export-zip，不重复展示 */}
        {row.downloadUrl?.trim() ? (
          <SkillVersionZipButton slug={skill.slug} versionLabel={row.version} />
        ) : null}
      </div>

      {row.changelog && (
        <section>
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            更新说明
          </h2>
          <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
            {row.changelog}
          </p>
        </section>
      )}

      <section>
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          文件清单
        </h2>
        {fileEntries.length === 0 ? (
          <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            暂无文件条目（可在外链下载或后续补充）
          </p>
        ) : (
          <SkillVersionFileExplorer files={fileEntries} />
        )}
      </section>
    </article>
  );
}
