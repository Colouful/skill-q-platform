"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import type { Review } from "@/generated/prisma";
import { LobsterRatingDisplay } from "@/components/skills/reviews/lobster-rating-display";
import { RuleReviewForm } from "./rule-review-form";

type Sort = "latest" | "helpful";

function formatDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RuleReviewsPanel({
  slug,
  initialReviews,
}: {
  slug: string;
  initialReviews: Review[];
}) {
  const router = useRouter();
  const [sort, setSort] = useState<Sort>("latest");
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [helpfulBusy, setHelpfulBusy] = useState<string | null>(null);

  const load = useCallback(
    async (next: Sort) => {
      setLoading(true);
      const q = next === "helpful" ? "helpful" : "latest";
      const res = await fetchApi<Review[]>(`/api/rules/${slug}/reviews?sort=${q}`);
      setLoading(false);
      if (res.code === 0 && res.data) {
        setReviews(res.data);
        setSort(next);
      } else {
        toast.error(res.message || "加载失败");
      }
    },
    [slug],
  );

  useEffect(() => {
    if (sort === "latest") {
      setReviews(initialReviews);
    }
  }, [initialReviews, sort]);

  async function onHelpful(id: string) {
    setHelpfulBusy(id);
    const res = await fetchApi<{ id: string; isHelpful: number }>(
      `/api/reviews/${id}/helpful`,
      { method: "POST", body: JSON.stringify({}) },
    );
    setHelpfulBusy(null);
    if (res.code === 0 && res.data) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === res.data!.id ? { ...r, isHelpful: res.data!.isHelpful } : r,
        ),
      );
      if (sort === "helpful") {
        await load("helpful");
      }
      toast.success("+1 有用");
    } else {
      toast.error(res.message || "操作失败");
    }
  }

  function onReviewCreated() {
    void load(sort);
    router.refresh();
  }

  return (
    <section className="space-y-4 border-t-4 border-[var(--rule-border)] pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          评测
        </h2>
        <div className="flex gap-2 font-[family-name:var(--font-pixel-body)] text-xs">
          <Button
            type="button"
            variant={sort === "latest" ? "default" : "outline"}
            disabled={loading}
            onClick={() => void load("latest")}
            className="h-8 border-2 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
          >
            最新
          </Button>
          <Button
            type="button"
            variant={sort === "helpful" ? "default" : "outline"}
            disabled={loading}
            onClick={() => void load("helpful")}
            className="h-8 border-2 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
          >
            最有用
          </Button>
        </div>
      </div>

      <RuleReviewForm slug={slug} onSuccess={onReviewCreated} />

      {loading && reviews.length === 0 ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          加载中…
        </p>
      ) : reviews.length === 0 ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          暂无评测，来当第一条
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="border-2 border-[var(--rule-border)] bg-[#fffef8] p-3 font-[family-name:var(--font-pixel-body)] text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[var(--pixel-fg)]">{r.author}</span>
                <time
                  className="text-xs text-[var(--pixel-muted)]"
                  dateTime={
                    typeof r.createdAt === "string"
                      ? r.createdAt
                      : r.createdAt.toISOString()
                  }
                >
                  {formatDate(r.createdAt)}
                </time>
              </div>
              <div className="mt-2">
                <LobsterRatingDisplay rating={r.rating} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[var(--pixel-fg)]">{r.content}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={helpfulBusy === r.id}
                  onClick={() => void onHelpful(r.id)}
                  className="h-8 border-2 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)] text-xs"
                >
                  {helpfulBusy === r.id ? "…" : `有用 · ${r.isHelpful}`}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
