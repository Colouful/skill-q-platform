import { Suspense } from "react";
import Link from "next/link";
import { UnifiedSearchBar } from "@/components/search/unified-search-bar";
import { runUnifiedSearchCached } from "@/lib/search-result-cache";
import { type UnifiedSearchType } from "@/lib/unified-search";
import { SearchTypeTabs } from "@/components/search/search-type-tabs";
import { UnifiedSearchResults } from "@/components/search/unified-search-results";
import { SearchHistoryRecorder } from "@/components/search/search-history-recorder";
import { SearchHistoryChips } from "@/components/search/search-history-chips";
import { SearchPopularChips } from "@/components/search/search-popular-chips";

export const dynamic = "force-dynamic";

function parseType(raw: string | undefined): UnifiedSearchType {
  const t = raw?.trim().toLowerCase();
  if (t === "skill" || t === "rule" || t === "all") return t;
  return "all";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const type = parseType(sp.type);
  const { skills, rules } = await runUnifiedSearchCached(q, type);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/" className="hover:text-[var(--pixel-fg)]">
          首页
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">搜索</span>
      </nav>

      <header className="space-y-4 border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          搜索
        </h1>
        <Suspense fallback={<div className="h-11 max-w-xl rounded border-2 border-[var(--pixel-border)]/40 bg-muted/20" />}>
          <UnifiedSearchBar variant="page" />
        </Suspense>
        <SearchTypeTabs q={q} active={type} />
        <div className="space-y-3">
          <SearchHistoryChips />
          <SearchPopularChips />
        </div>
      </header>

      <Suspense fallback={null}>
        <SearchHistoryRecorder q={q} />
      </Suspense>

      <UnifiedSearchResults q={q} skills={skills} rules={rules} />
    </div>
  );
}
