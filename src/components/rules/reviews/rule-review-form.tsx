"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { PixelInput, PixelTextarea } from "@/components/pixel";
import { LobsterRatingInput } from "@/components/skills/reviews/lobster-rating-input";
import type { Review } from "@/generated/prisma";

export function RuleReviewForm({
  slug,
  onSuccess,
}: {
  slug: string;
  onSuccess: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetchApi<{ review: Review; agentLevelUp: unknown }>(`/api/rules/${slug}/reviews`, {
      method: "POST",
      body: JSON.stringify({
        rating,
        content,
        author,
      }),
    });
    setPending(false);
    if (res.code === 0 && res.data?.review) {
      if (res.data.agentLevelUp) {
        const u = res.data.agentLevelUp as { level: number; levelName: string };
        toast.success(`评测已发布 · 升至 Lv.${u.level} ${u.levelName}`);
      } else {
        toast.success("评测已发布");
      }
      setContent("");
      onSuccess();
    } else {
      toast.error(res.message || "发布失败");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 border-2 border-[var(--rule-border)] bg-[#fffef8] p-4"
    >
      <p className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
        写评测
      </p>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">评分</Label>
        <LobsterRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rule-review-author" className="font-[family-name:var(--font-pixel-body)]">
          昵称
        </Label>
        <PixelInput
          id="rule-review-author"
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={100}
          placeholder="你的昵称"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rule-review-content" className="font-[family-name:var(--font-pixel-body)]">
          内容
        </Label>
        <PixelTextarea
          id="rule-review-content"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="使用体验、建议…"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
      >
        {pending ? "提交中…" : "提交评测"}
      </Button>
    </form>
  );
}
