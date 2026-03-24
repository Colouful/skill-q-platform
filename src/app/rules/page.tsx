import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RuleCard } from "@/components/rule/rule-card";
import { RulesSearch } from "@/components/rules/rules-search";
import { PageLoadingLobster } from "@/components/layout/page-loading-lobster";
import { LobsterEmpty } from "@/components/lobster";
import { RulesPagination } from "@/components/rules/rules-pagination";
import { RulesCategorySidebar } from "@/components/rules/rules-category-sidebar";
import { RuleCategoryPixelIcon } from "@/components/rule/rule-category-pixel-icon";
import type { Prisma } from "@/generated/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { rulesListHref } from "@/lib/rules-list-url";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

async function RulesGrid({
  q,
  page,
  categorySlug,
}: {
  q?: string;
  page: number;
  categorySlug?: string;
}) {
  const where: Prisma.RuleWhereInput = {
    moderationStatus: MODERATION_STATUS.PUBLISHED,
  };
  if (categorySlug) {
    where.category = { slug: categorySlug, resourceType: "rule" };
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { slug: { contains: q } },
    ];
  }

  const [total, rules] = await Promise.all([
    prisma.rule.count({ where }),
    prisma.rule.findMany({
      where,
      include: { category: true },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (rules.length === 0) {
    return (
      <div className="py-12">
        <LobsterEmpty
          tone="rule"
          message={
            q
              ? "没有匹配的 Rule"
              : categorySlug
                ? "该分类下还没有 Rule"
                : "空空如也，来上传第一个 Rule 吧！"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="pixel-stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rules.map((r) => (
          <div key={r.id} className="skill-card-cv min-w-0">
            <RuleCard rule={r} highlightQuery={q} />
          </div>
        ))}
      </div>
      <RulesPagination
        page={page}
        totalPages={totalPages}
        q={q}
        category={categorySlug}
      />
    </div>
  );
}

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const categorySlug = sp.category?.trim() || undefined;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const categories = await prisma.category.findMany({
    where: { resourceType: "rule" },
    orderBy: { sortOrder: "asc" },
  });

  const navActive =
    "rounded-[var(--hub-radius-sm)] border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-2 py-1 text-[var(--pixel-fg)]";
  const navIdle =
    "border-2 border-transparent px-2 py-1 text-[var(--pixel-muted)] transition hover:-translate-y-px hover:border-[var(--pixel-border)] hover:shadow-[var(--hub-shadow-btn-outline-hover)] rounded-[var(--hub-radius-sm)]";

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/" className="hover:text-[var(--pixel-fg)]">
          首页
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">Rules</span>
      </nav>

      {/*
        桌面：左侧分类 sticky、无内部滚动条；右侧随页面（main）滚动。
      */}
      <div className="lg:grid lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div
          className={cn(
            "hidden lg:sticky lg:z-10 lg:block lg:max-w-[240px] lg:shrink-0 lg:self-start",
            "lg:top-2",
          )}
        >
          <RulesCategorySidebar
            categories={categories}
            categorySlug={categorySlug}
            q={q}
          />
        </div>

        <div className="min-w-0 space-y-8">
          <div className="flex flex-col gap-4 border-b-4 border-[var(--pixel-border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
              Rules
            </h1>
            <nav
              className="flex flex-wrap gap-2 font-[family-name:var(--font-pixel-body)] text-sm lg:hidden"
              aria-label="Rule 分类筛选"
            >
              <Link
                href={rulesListHref({ q, category: undefined })}
                className={cn(!categorySlug ? navActive : navIdle)}
              >
                全部
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={rulesListHref({ q, category: c.slug })}
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    categorySlug === c.slug ? navActive : navIdle,
                  )}
                >
                  <RuleCategoryPixelIcon slug={c.slug} className="h-5 w-5" />
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <RulesSearch initialQ={q ?? ""} categorySlug={categorySlug} />
            <Link
              href="/rules/upload"
              className="hub-list-upload-cta hub-apple-gradient-cta inline-flex items-center justify-center border-4 border-[var(--pixel-border)] px-4 py-2 font-[family-name:var(--font-pixel-body)] text-lg shadow-[4px_4px_0_0_var(--pixel-border)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--pixel-border)]"
            >
              上传 Rule
            </Link>
          </div>

          <Suspense fallback={<PageLoadingLobster />}>
            <RulesGrid q={q} page={page} categorySlug={categorySlug} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
