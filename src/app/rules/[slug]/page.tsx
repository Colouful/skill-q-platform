import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { getAdminFromSessionCookie } from "@/lib/admin-auth";
import { canViewUnpublishedResource } from "@/lib/moderation";
import { canEditSkillOrRule } from "@/lib/skill-rule-write-access";
import { RuleJsonLd } from "@/components/seo/rule-json-ld";
import { RuleDetailActions } from "@/components/rules/rule-detail-actions";
import { RuleVersionsList } from "@/components/rules/rule-versions-list";
import { RuleReviewsPanel } from "@/components/rules/reviews/rule-reviews-panel";
import { DownloadPolicyBadge } from "@/components/hub/download-policy-badge";
import { rulePath } from "@/lib/slug-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rule = await prisma.rule.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      moderationStatus: true,
      authorAgentId: true,
    },
  });
  if (!rule) {
    return { title: "Rule" };
  }
  const agent = await getOptionalAuthAgentFromCookies();
  const admin = await getAdminFromSessionCookie();
  const canView =
    Boolean(admin) ||
    canViewUnpublishedResource(rule.moderationStatus, rule.authorAgentId, agent?.id ?? null);
  if (!canView) {
    return { title: "Rule" };
  }
  const desc = rule.description.slice(0, 160);
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return {
    title: rule.name,
    description: desc,
    openGraph: {
      title: rule.name,
      description: desc,
      type: "article",
      ...(base ? { url: `${base}${rulePath(rule.slug)}` } : {}),
      images: [{ url: "/patterns/sketch-paper.svg", alt: rule.name }],
    },
    twitter: { card: "summary_large_image", title: rule.name, description: desc },
  };
}

export default async function RuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rule = await prisma.rule.findUnique({
    where: { slug },
    include: {
      category: true,
      versions: { orderBy: { createdAt: "desc" } },
    },
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

  const canEdit = canEditSkillOrRule(viewer, rule.authorAgentId, rule.author);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || `${proto}://${host}`;

  const initialReviews = await prisma.review.findMany({
    where: { ruleId: rule.id, resourceType: "rule" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const forkParent = rule.forkedFromRuleId
    ? await prisma.rule.findUnique({
        where: { id: rule.forkedFromRuleId },
        select: { slug: true, name: true },
      })
    : null;

  const tags = Array.isArray(rule.tags)
    ? (rule.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : [];

  return (
    <article className="mx-auto w-full max-w-4xl space-y-6 pb-8 2xl:max-w-5xl">
      <RuleJsonLd
        name={rule.name}
        description={rule.description}
        slug={rule.slug}
        author={rule.author}
        siteOrigin={siteOrigin}
      />
      <nav
        className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]"
        aria-label="面包屑"
      >
        <Link href="/rules" className="hover:text-[var(--pixel-fg)]">
          Rules
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">{rule.name}</span>
      </nav>

      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--rule-accent)]">
          {rule.category.name}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-pixel-heading)] text-xl text-[var(--pixel-fg)] sm:text-2xl">
          {rule.name}
        </h1>
        <p className="mt-4 font-[family-name:var(--font-pixel-body)] text-lg text-[var(--pixel-muted)]">
          {rule.description}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          <DownloadPolicyBadge policy={rule.downloadPolicy} />
          <span>
            作者 {rule.author} · ⭐ {rule.rating.toFixed(1)} · ⬇ {rule.downloads}
          </span>
        </p>
        {forkParent && (
          <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
            Fork 自{" "}
            <Link
              href={rulePath(forkParent.slug)}
              className="text-[var(--rule-accent)] underline decoration-[var(--rule-border)] decoration-2 underline-offset-2"
            >
              {forkParent.name}
            </Link>
          </p>
        )}
        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li
                key={t}
                className="border-2 border-[var(--rule-border)] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      {rule.longDescription && (
        <section className="font-[family-name:var(--font-pixel-body)] text-base whitespace-pre-wrap text-[var(--pixel-fg)]">
          {rule.longDescription}
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
            版本
          </h2>
          {canEdit ? (
            <Link
              href="/rules/upload"
              className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-3 py-1 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-95"
            >
              上传新版本
            </Link>
          ) : null}
        </div>
        <RuleVersionsList slug={rule.slug} versions={rule.versions} />
      </section>

      <RuleReviewsPanel slug={rule.slug} initialReviews={initialReviews} />

      <RuleDetailActions
        slug={rule.slug}
        defaultForkName={`${rule.name} (Fork)`}
        defaultForkAuthor={rule.author}
        canEdit={canEdit}
      />
    </article>
  );
}
