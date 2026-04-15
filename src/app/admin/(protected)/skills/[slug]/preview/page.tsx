import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillVersionFileExplorer } from "@/components/skills/skill-version-file-explorer";
import { prisma } from "@/lib/prisma";
import { parseVersionFilesJson } from "@/lib/skill-file-entries";
import { skillPath } from "@/lib/slug-url";

export const dynamic = "force-dynamic";

export default async function AdminSkillPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      category: true,
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!skill) notFound();

  const latestVersion = skill.versions[0] ?? null;
  const latestFiles = parseVersionFilesJson(latestVersion?.files);
  const publicHref = latestVersion
    ? skillPath(skill.slug, `/versions/${encodeURIComponent(latestVersion.version)}`)
    : skillPath(skill.slug);

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/admin/skills/manage" className="hover:text-[var(--pixel-fg)]">
          Skill 管理
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">预览 {skill.name}</span>
      </nav>

      <section className="space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-accent)]">
              {skill.category.name}
            </p>
            <h1 className="font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)]">
              {skill.name}
            </h1>
            <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
              {skill.description}
            </p>
            <div className="flex flex-wrap gap-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              <span>Slug：{skill.slug}</span>
              <span>状态：{skill.moderationStatus}</span>
              <span>最新版本：{latestVersion?.version ?? "暂无版本"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/skills/${encodeURIComponent(skill.slug)}/edit`}
              className="inline-flex items-center border-2 border-[var(--pixel-border)] px-3 py-1 text-sm hover:bg-[var(--pixel-cyan)]/20"
            >
              编辑
            </Link>
            <Link
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center border-2 border-[var(--pixel-border)] px-3 py-1 text-sm hover:bg-[var(--pixel-yellow)]/30"
            >
              打开公开页
            </Link>
          </div>
        </div>

        {skill.longDescription ? (
          <section className="border-t-2 border-[var(--pixel-border)] pt-4">
            <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
              详细说明
            </h2>
            <p className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
              {skill.longDescription}
            </p>
          </section>
        ) : null}

        <section className="border-t-2 border-[var(--pixel-border)] pt-4">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            最新版本内容
          </h2>
          {latestVersion ? (
            latestFiles.length > 0 ? (
              <SkillVersionFileExplorer files={latestFiles} />
            ) : (
              <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
                最新版本存在，但未存储文件内容。
              </p>
            )
          ) : (
            <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
              该 Skill 暂无版本，暂无可预览内容。
            </p>
          )}
        </section>
      </section>
    </div>
  );
}
