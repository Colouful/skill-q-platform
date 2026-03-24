import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { SkillCard } from "@/components/skill/skill-card";
import { SkillsSearch } from "@/components/skills/skills-search";
import { PageLoadingLobster } from "@/components/layout/page-loading-lobster";
import { LobsterEmpty } from "@/components/lobster";
import { SkillsPagination } from "@/components/skills/skills-pagination";
import type { Prisma } from "@/generated/prisma";
import { skillsListHref } from "@/lib/skills-list-url";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

async function SkillsGrid({
  q,
  page,
  categorySlug,
}: {
  q?: string;
  page: number;
  categorySlug?: string;
}) {
  const where: Prisma.SkillWhereInput = {};
  if (categorySlug) {
    where.category = { slug: categorySlug, resourceType: "skill" };
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { slug: { contains: q } },
    ];
  }

  const [total, skills] = await Promise.all([
    prisma.skill.count({ where }),
    prisma.skill.findMany({
      where,
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (skills.length === 0) {
    return (
      <div className="py-12">
        <LobsterEmpty
          message={
            q
              ? "没有匹配的 Skill"
              : categorySlug
                ? "该分类下还没有 Skill"
                : "空空如也，来上传第一个 Skill 吧！"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pixel-stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skills.map((s) => (
          <div key={s.id} className="skill-card-cv min-w-0">
            <SkillCard skill={s} highlightQuery={q} />
          </div>
        ))}
      </div>
      <SkillsPagination
        page={page}
        totalPages={totalPages}
        q={q}
        category={categorySlug}
      />
    </div>
  );
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categorySlug = sp.category?.trim() || undefined;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const categories = await prisma.category.findMany({
    where: { resourceType: "skill" },
    orderBy: { sortOrder: "asc" },
  });

  const navActive =
    "rounded-[var(--hub-radius-sm)] border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-2 py-1 text-[var(--pixel-fg)]";
  const navIdle =
    "border-2 border-transparent px-2 py-1 text-[var(--pixel-muted)] transition hover:-translate-y-px hover:border-[var(--pixel-border)] hover:shadow-[var(--hub-shadow-btn-outline-hover)] rounded-[var(--hub-radius-sm)]";

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <div className="flex flex-col gap-4 border-b-4 border-[var(--pixel-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          Skills
        </h1>
        <nav
          className="flex flex-wrap gap-2 font-[family-name:var(--font-pixel-body)] text-sm"
          aria-label="分类筛选"
        >
          <Link
            href={skillsListHref({ q, category: undefined })}
            className={cn(!categorySlug ? navActive : navIdle)}
          >
            全部
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={skillsListHref({ q, category: c.slug })}
              className={cn(categorySlug === c.slug ? navActive : navIdle)}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SkillsSearch initialQ={q ?? ""} categorySlug={categorySlug} />
        <Link
          href="/skills/upload"
          className="hub-apple-gradient-cta inline-flex items-center justify-center border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-4 py-2 font-[family-name:var(--font-pixel-body)] text-lg text-[var(--pixel-fg)] shadow-[4px_4px_0_0_var(--pixel-border)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--pixel-border)]"
        >
          上传 Skill
        </Link>
      </div>

      <Suspense fallback={<PageLoadingLobster />}>
        <SkillsGrid q={q} page={page} categorySlug={categorySlug} />
      </Suspense>
    </div>
  );
}
