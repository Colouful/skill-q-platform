import Link from "next/link";
import type { AnalyticsHighlights } from "@/lib/admin-analytics-queries";
import { rulePath, skillPath } from "@/lib/slug-url";

function formatDate(d: Date) {
  try {
    return new Date(d).toLocaleString("zh-CN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(d);
  }
}

export function AdminDashboardHighlights({ data }: { data: AnalyticsHighlights }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-3">
        <p className="mb-2 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
          热门 Skill（下载）
        </p>
        <div className="space-y-2">
          {data.topSkills.length === 0 ? (
            <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">暂无</p>
          ) : (
            data.topSkills.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 border-2 border-[var(--pixel-border)] bg-white/60 px-2 py-1.5"
              >
                <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                  {i + 1}.
                </span>
                <Link
                  href={skillPath(s.slug)}
                  className="min-w-0 flex-1 truncate font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.name}
                </Link>
                <span className="shrink-0 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]">
                  ⬇ {s.downloads}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-3">
        <p className="mb-2 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
          热门 Rule（下载）
        </p>
        <div className="space-y-2">
          {data.topRules.length === 0 ? (
            <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">暂无</p>
          ) : (
            data.topRules.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 border-2 border-[var(--pixel-border)] bg-white/60 px-2 py-1.5"
              >
                <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
                  {i + 1}.
                </span>
                <Link
                  href={rulePath(r.slug)}
                  className="min-w-0 flex-1 truncate font-[family-name:var(--font-pixel-body)] text-xs text-[var(--rule-accent)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.name}
                </Link>
                <span className="shrink-0 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]">
                  ⬇ {r.downloads}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-4 border-[var(--pixel-border)] bg-[#fffef8] p-3">
        <p className="mb-2 font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
          最新特工
        </p>
        <div className="space-y-2">
          {data.recentAgents.length === 0 ? (
            <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">暂无</p>
          ) : (
            data.recentAgents.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-1 border-2 border-[var(--pixel-border)] bg-white/60 px-2 py-1.5"
              >
                <Link
                  href={`/admin/agents/${a.id}`}
                  className="min-w-0 flex-1 truncate font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] underline"
                >
                  {a.name}
                </Link>
                <span className="font-[family-name:var(--font-pixel-body)] text-[10px] text-[var(--pixel-muted)]">
                  Lv.{a.level} · {formatDate(a.registeredAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
