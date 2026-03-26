import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { canViewUnpublishedResource } from "@/lib/moderation";
import { canEditSkillOrRule } from "@/lib/skill-rule-write-access";
import { SkillJsonLd } from "@/components/seo/skill-json-ld";
import { SkillDetailActions } from "@/components/skills/skill-detail-actions";
import { SkillVersionsList } from "@/components/skills/skill-versions-list";
import { SkillReviewsPanel } from "@/components/skills/reviews/skill-reviews-panel";
import { DownloadPolicyBadge } from "@/components/hub/download-policy-badge";
import { skillPath } from "@/lib/slug-url";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      moderationStatus: true,
      authorAgentId: true,
    },
  });
  if (!skill) {
    return { title: "Skill" };
  }
  const agent = await getOptionalAuthAgentFromCookies();
  if (!canViewUnpublishedResource(skill.moderationStatus, skill.authorAgentId, agent?.id ?? null)) {
    return { title: "Skill" };
  }
  const desc = skill.description.slice(0, 160);
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return {
    title: skill.name,
    description: desc,
    openGraph: {
      title: skill.name,
      description: desc,
      type: "article",
      ...(base ? { url: `${base}${skillPath(skill.slug)}` } : {}),
      images: [{ url: "/patterns/sketch-paper.svg", alt: skill.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: skill.name,
      description: desc,
    },
  };
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      category: true,
      versions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!skill) notFound();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || `${proto}://${host}`;

  const viewer = await getOptionalAuthAgentFromCookies();
  if (!canViewUnpublishedResource(skill.moderationStatus, skill.authorAgentId, viewer?.id ?? null)) {
    notFound();
  }

  const canEdit = canEditSkillOrRule(viewer, skill.authorAgentId, skill.author);

  const initialReviews = await prisma.review.findMany({
    where: { skillId: skill.id, resourceType: "skill" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tags = Array.isArray(skill.tags)
    ? (skill.tags as unknown[])
        .filter((t): t is string => typeof t === "string")
    : [];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-5 xl:max-w-7xl">
      <SkillJsonLd
        name={skill.name}
        description={skill.description}
        slug={skill.slug}
        author={skill.author}
        siteOrigin={siteOrigin}
        rating={skill.rating}
        reviewCount={skill.reviewCount}
      />
      <nav className="mb-6 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/skills" className="hover:text-[var(--pixel-fg)]">
          Skills
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">{skill.name}</span>
      </nav>

      <div className="min-w-0 space-y-6">
      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-accent)]">
          {skill.category.name}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)] sm:text-2xl">
          {skill.name}
        </h1>
        <p className="mt-4 font-[family-name:var(--font-pixel-body)] text-lg text-[var(--pixel-muted)]">
          {skill.description}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          <DownloadPolicyBadge policy={skill.downloadPolicy} />
          <span>
            作者 {skill.author} · ⭐ {skill.rating.toFixed(1)} · ⬇ {skill.downloads}
          </span>
        </p>
        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li
                key={t}
                className="border-2 border-[var(--pixel-border)] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      {skill.longDescription && (
        <section className="font-[family-name:var(--font-pixel-body)] text-base whitespace-pre-wrap text-[var(--pixel-fg)]">
          {skill.longDescription}
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            版本
          </h2>
          {canEdit ? (
            <Link
              href={skillPath(skill.slug, "/versions/new")}
              className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-3 py-1 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-95"
            >
              发布新版本
            </Link>
          ) : null}
        </div>
        <SkillVersionsList slug={skill.slug} versions={skill.versions} />
      </section>

      <SkillReviewsPanel slug={skill.slug} initialReviews={initialReviews} />

      <SkillDetailActions
        slug={skill.slug}
        defaultForkName={`${skill.name} (Fork)`}
        defaultForkAuthor={skill.author}
        canEdit={canEdit}
      />
      </div>
    </article>
  );
}
