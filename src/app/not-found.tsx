import Link from "next/link";
import { Lobster404 } from "@/components/lobster";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-12" role="main">
      <Lobster404 />
      <p className="mt-4 max-w-md text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        页面未找到。可前往「Rules」浏览规则包，或从首页重新搜索。
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-4 py-2 font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)] shadow-[var(--hub-shadow-card-skill)]"
        >
          返回首页
        </Link>
        <Link
          href="/rules"
          className="border-4 border-[var(--rule-border)] bg-[#fffef8] px-4 py-2 font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)] shadow-[var(--hub-shadow-card-rule)]"
        >
          Rules
        </Link>
      </div>
    </div>
  );
}
