import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { DiscoverSkillGrid } from "@/components/discover/discover-skill-grid";
import { DiscoverRuleGrid } from "@/components/discover/discover-rule-grid";
import { TrendingControls } from "@/components/discover/trending-controls";
import {
  parseTrendingParams,
  ruleOrderBy,
  skillOrderBy,
} from "@/lib/trending-query";

export const dynamic = "force-dynamic";

const sortSubtitle: Record<string, string> = {
  downloads: "按下载量排序",
  rating: "按评分与评测数排序",
  recent: "按最近更新时间排序",
};

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; limit?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const parsed = parseTrendingParams(sp);

  const sub = sortSubtitle[parsed.sort] ?? sortSubtitle.downloads;

  if (parsed.type === "skill") {
    const skills = await prisma.skill.findMany({
      include: { category: true },
      orderBy: skillOrderBy(parsed.sort),
      take: parsed.limit,
    });

    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
        <TrendingLayout parsed={parsed} sub={sub}>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-accent)]">
              Skill 热门（{skills.length}）
            </h2>
            <DiscoverSkillGrid skills={skills} />
          </section>
        </TrendingLayout>
      </div>
    );
  }

  if (parsed.type === "rule") {
    const rules = await prisma.rule.findMany({
      include: { category: true },
      orderBy: ruleOrderBy(parsed.sort),
      take: parsed.limit,
    });

    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
        <TrendingLayout parsed={parsed} sub={sub}>
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--rule-accent)]">
              Rule 热门（{rules.length}）
            </h2>
            <DiscoverRuleGrid rules={rules} />
          </section>
        </TrendingLayout>
      </div>
    );
  }

  const [skills, rules] = await Promise.all([
    prisma.skill.findMany({
      include: { category: true },
      orderBy: skillOrderBy(parsed.sort),
      take: parsed.limit,
    }),
    prisma.rule.findMany({
      include: { category: true },
      orderBy: ruleOrderBy(parsed.sort),
      take: parsed.limit,
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-10 pb-8">
      <TrendingLayout parsed={parsed} sub={sub}>
        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-accent)]">
            Skills（{skills.length}）
          </h2>
          <DiscoverSkillGrid skills={skills} />
        </section>
        <section className="space-y-4 border-t-4 border-[var(--rule-border)] pt-8">
          <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--rule-accent)]">
            Rules（{rules.length}）
          </h2>
          <DiscoverRuleGrid rules={rules} />
        </section>
      </TrendingLayout>
    </div>
  );
}

function TrendingLayout({
  parsed,
  sub,
  children,
}: {
  parsed: ReturnType<typeof parseTrendingParams>;
  sub: string;
  children: ReactNode;
}) {
  return (
    <>
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/" className="hover:text-[var(--pixel-fg)]">
          首页
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">热门</span>
      </nav>

      <div className="flex flex-wrap gap-3 border-b-2 border-[var(--pixel-border)]/60 pb-3 font-[family-name:var(--font-pixel-body)] text-xs">
        <Link
          href="/skills"
          className="text-[var(--pixel-accent)] underline decoration-[var(--pixel-border)] decoration-2 underline-offset-2"
        >
          Skills
        </Link>
        <Link
          href="/rules"
          className="text-[var(--rule-accent)] underline decoration-[var(--rule-border)] decoration-2 underline-offset-2"
        >
          Rules
        </Link>
        <Link
          href="/search"
          className="text-[var(--pixel-muted)] underline underline-offset-2 hover:text-[var(--pixel-fg)]"
        >
          搜索
        </Link>
      </div>

      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          热门榜单
        </h1>
        <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          {parsed.type === "all"
            ? `${sub} · Skill 与 Rule 各取 Top ${parsed.limit}`
            : `${sub} · Top ${parsed.limit}`}
        </p>
      </header>

      <TrendingControls
        type={parsed.type}
        limit={parsed.limit}
        sort={parsed.sort}
      />

      {children}
    </>
  );
}
