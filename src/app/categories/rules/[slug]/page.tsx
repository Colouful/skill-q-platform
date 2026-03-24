import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RuleCard } from "@/components/rule/rule-card";
import { LobsterEmpty } from "@/components/lobster";
import { RulesPagination } from "@/components/rules/rules-pagination";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function RuleCategoryBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const category = await prisma.category.findUnique({
    where: { slug_resourceType: { slug, resourceType: "rule" } },
  });
  if (!category) notFound();

  const where = { categoryId: category.id };

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
  const basePath = `/categories/rules/${encodeURIComponent(slug)}`;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/" className="hover:text-[var(--pixel-fg)]">
          首页
        </Link>
        <span className="mx-1">/</span>
        <Link href="/rules" className="hover:text-[var(--pixel-fg)]">
          Rules
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">{category.name}</span>
      </nav>

      <header className="border-b-4 border-[var(--rule-border)] pb-6">
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--rule-accent)]">
          Rule 分类
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-2xl font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            {category.description}
          </p>
        )}
        <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          共 {total} 条 Rule
        </p>
      </header>

      {rules.length === 0 ? (
        <div className="py-12">
          <LobsterEmpty tone="rule" message="该分类下还没有 Rule" />
        </div>
      ) : (
        <>
          <div className="pixel-stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rules.map((r) => (
              <div key={r.id} className="skill-card-cv min-w-0">
                <RuleCard rule={r} />
              </div>
            ))}
          </div>
          <RulesPagination
            page={page}
            totalPages={totalPages}
            basePath={basePath}
          />
        </>
      )}

      <p className="border-t-4 border-[var(--pixel-border)] pt-6 font-[family-name:var(--font-pixel-body)] text-sm">
        <Link
          href="/rules"
          className={cn(
            "text-[var(--rule-accent)] underline decoration-[var(--rule-border)] decoration-2 underline-offset-2",
          )}
        >
          ← 返回 Rules 列表
        </Link>
      </p>
    </div>
  );
}
