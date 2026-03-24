import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SkillDetailActions } from "@/components/skills/skill-detail-actions";
import { SkillVersionsList } from "@/components/skills/skill-versions-list";
import { SkillReviewsPanel } from "@/components/skills/reviews/skill-reviews-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!skill) {
    return { title: "Skill" };
  }
  const desc = skill.description.slice(0, 160);
  return {
    title: skill.name,
    description: desc,
    openGraph: {
      title: skill.name,
      description: desc,
      type: "article",
    },
    twitter: {
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
    <article className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/skills" className="hover:text-[var(--pixel-fg)]">
          Skills
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">{skill.name}</span>
      </nav>

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
        <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          作者 {skill.author} · ⭐ {skill.rating.toFixed(1)} · ⬇ {skill.downloads}
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
          <Link
            href={`/skills/${skill.slug}/versions/new`}
            className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-3 py-1 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-95"
          >
            发布新版本
          </Link>
        </div>
        <SkillVersionsList slug={skill.slug} versions={skill.versions} />
      </section>

      <SkillReviewsPanel slug={skill.slug} initialReviews={initialReviews} />

      <SkillDetailActions
        slug={skill.slug}
        defaultForkName={`${skill.name} (Fork)`}
        defaultForkAuthor={skill.author}
      />
    </article>
  );
}
