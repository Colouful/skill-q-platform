import Link from "next/link";
import { format } from "date-fns";

export type MeActivityProps = {
  skills: { slug: string; name: string; createdAt: Date }[];
  rules: { slug: string; name: string; createdAt: Date }[];
  reviews: {
    id: string;
    resourceType: string;
    rating: number;
    content: string;
    createdAt: Date;
    skill: { slug: string } | null;
    rule: { slug: string } | null;
  }[];
  /** 仅「最近评测」分页 */
  reviewsPagination?: { page: number; hasMore: boolean };
};

export function MeActivitySection({
  skills,
  rules,
  reviews,
  reviewsPagination,
}: MeActivityProps) {
  const hasAny = skills.length > 0 || rules.length > 0 || reviews.length > 0;
  if (!hasAny) {
    return (
      <section className="border-t-2 border-[var(--pixel-border)]/30 pt-4">
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          最近活动
        </h2>
        <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          暂无上传或评测记录。上传 Skill / Rule 或发布评测后会显示在这里。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 border-t-2 border-[var(--pixel-border)]/30 pt-4">
      <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
        最近活动
      </h2>

      {skills.length > 0 ? (
        <div>
          <h3 className="font-[family-name:var(--font-pixel-body)] text-xs font-bold text-[var(--pixel-muted)]">
            最近上传 · Skill
          </h3>
          <ul className="mt-2 space-y-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]">
            {skills.map((s) => (
              <li key={s.slug} className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/skills/${encodeURIComponent(s.slug)}`}
                  className="truncate text-[var(--pixel-cyan)] underline decoration-2 underline-offset-2 hover:text-[var(--pixel-fg)]"
                >
                  {s.name}
                </Link>
                <time className="shrink-0 text-[var(--pixel-muted)]" dateTime={s.createdAt.toISOString()}>
                  {format(s.createdAt, "yyyy-MM-dd HH:mm")}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rules.length > 0 ? (
        <div>
          <h3 className="font-[family-name:var(--font-pixel-body)] text-xs font-bold text-[var(--pixel-muted)]">
            最近上传 · Rule
          </h3>
          <ul className="mt-2 space-y-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]">
            {rules.map((r) => (
              <li key={r.slug} className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/rules/${encodeURIComponent(r.slug)}`}
                  className="truncate text-[var(--pixel-cyan)] underline decoration-2 underline-offset-2 hover:text-[var(--pixel-fg)]"
                >
                  {r.name}
                </Link>
                <time className="shrink-0 text-[var(--pixel-muted)]" dateTime={r.createdAt.toISOString()}>
                  {format(r.createdAt, "yyyy-MM-dd HH:mm")}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div>
          <h3 className="font-[family-name:var(--font-pixel-body)] text-xs font-bold text-[var(--pixel-muted)]">
            最近评测
          </h3>
          {reviewsPagination && (reviewsPagination.page > 1 || reviewsPagination.hasMore) ? (
            <div className="mt-2 flex flex-wrap gap-2 font-[family-name:var(--font-pixel-body)] text-[10px] text-[var(--pixel-muted)]">
              {reviewsPagination.page > 1 ? (
                <Link
                  href={
                    reviewsPagination.page <= 2
                      ? "/me"
                      : `/me?revPage=${reviewsPagination.page - 1}`
                  }
                  className="underline decoration-2 underline-offset-2 hover:text-[var(--pixel-fg)]"
                >
                  上一页
                </Link>
              ) : null}
              <span>第 {reviewsPagination.page} 页</span>
              {reviewsPagination.hasMore ? (
                <Link
                  href={`/me?revPage=${reviewsPagination.page + 1}`}
                  className="underline decoration-2 underline-offset-2 hover:text-[var(--pixel-fg)]"
                >
                  下一页
                </Link>
              ) : null}
            </div>
          ) : null}
          <ul className="mt-2 space-y-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]">
            {reviews.map((rev) => {
              const href =
                rev.resourceType === "rule" && rev.rule
                  ? `/rules/${encodeURIComponent(rev.rule.slug)}`
                  : rev.skill
                    ? `/skills/${encodeURIComponent(rev.skill.slug)}`
                    : null;
              const preview = rev.content.length > 80 ? `${rev.content.slice(0, 80)}…` : rev.content;
              return (
                <li key={rev.id} className="border-l-2 border-[var(--pixel-border)]/50 pl-2">
                  <div className="flex flex-wrap items-center gap-2 text-[var(--pixel-muted)]">
                    <span className="text-[var(--pixel-fg)]">★ {rev.rating}</span>
                    <span className="uppercase">{rev.resourceType}</span>
                    <time dateTime={rev.createdAt.toISOString()}>
                      {format(rev.createdAt, "yyyy-MM-dd HH:mm")}
                    </time>
                  </div>
                  {href ? (
                    <Link href={href} className="mt-0.5 block text-[var(--pixel-cyan)] hover:underline">
                      {preview}
                    </Link>
                  ) : (
                    <p className="mt-0.5 text-[var(--pixel-fg)]">{preview}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
