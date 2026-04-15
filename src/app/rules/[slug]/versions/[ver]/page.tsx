import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { getAdminFromSessionCookie } from "@/lib/admin-auth";
import { RuleVersionDownloadButton } from "@/components/rules/rule-version-download-button";
import { SkillVersionFileExplorer } from "@/components/skills/skill-version-file-explorer";
import { parseVersionFilesJson } from "@/lib/skill-file-entries";
import { canViewUnpublishedResource } from "@/lib/moderation";
import { rulePath } from "@/lib/slug-url";

export const dynamic = "force-dynamic";

export default async function RuleVersionDetailPage({
  params,
}: {
  params: Promise<{ slug: string; ver: string }>;
}) {
  const { slug, ver } = await params;
  const versionLabel = decodeURIComponent(ver);

  const rule = await prisma.rule.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!rule) notFound();

  const viewer = await getOptionalAuthAgentFromCookies();
  const admin = await getAdminFromSessionCookie();
  const canView =
    Boolean(admin) ||
    canViewUnpublishedResource(rule.moderationStatus, rule.authorAgentId, viewer?.id ?? null);
  if (!canView) {
    notFound();
  }

  const row = await prisma.ruleVersion.findUnique({
    where: {
      ruleId_version: { ruleId: rule.id, version: versionLabel },
    },
  });
  if (!row) notFound();

  const fileEntries = parseVersionFilesJson(row.files);

  return (
    <article className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/rules" className="hover:text-[var(--pixel-fg)]">
          Rules
        </Link>
        <span className="mx-1">/</span>
        <Link href={rulePath(rule.slug)} className="hover:text-[var(--pixel-fg)]">
          {rule.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">v{row.version}</span>
      </nav>

      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <p className="font-[family-name:var(--font-pixel-body)] text-[var(--rule-accent)]">
          {rule.category.name}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)] sm:text-2xl">
          {rule.name}
          <span className="text-[var(--pixel-muted)]"> · </span>
          <span className="text-[var(--rule-accent)]">v{row.version}</span>
        </h1>
        {row.isLatest && (
          <p className="mt-2 inline-block border-2 border-[var(--rule-border)] px-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--rule-accent)]">
            latest
          </p>
        )}
      </header>

      <div className="flex flex-wrap items-start gap-4">
        <RuleVersionDownloadButton
          slug={rule.slug}
          versionLabel={row.version}
          initialVersionDownloads={row.downloads}
        />
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
