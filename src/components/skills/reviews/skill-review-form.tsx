"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { apiSkillPath } from "@/lib/slug-url";
import { PixelTextarea } from "@/components/pixel";
import { LobsterRatingInput } from "./lobster-rating-input";
import type { Review } from "@/generated/prisma";

/** 10.2 发布评测（须登录，作者名为档案昵称） */
export function SkillReviewForm({
  slug,
  onSuccess,
}: {
  slug: string;
  onSuccess: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [meName, setMeName] = useState("");
  const [gate, setGate] = useState<"loading" | "anon" | "noname" | "ready">("loading");

  useEffect(() => {
    void fetchApi<{ agent: { name: string } | null }>("/api/auth/me").then((res) => {
      if (res.code !== 0 || !res.data?.agent) {
        setGate("anon");
        return;
      }
      const n = res.data.agent.name.trim();
      if (!n) {
        setGate("noname");
        return;
      }
      setMeName(n);
      setGate("ready");
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetchApi<{ review: Review; agentLevelUp: unknown }>(apiSkillPath(slug, "/reviews"), {
      method: "POST",
      body: JSON.stringify({
        rating,
        content,
      }),
    });
    setPending(false);
    if (res.code === 0 && res.data?.review) {
      if (res.data.agentLevelUp) {
        const u = res.data.agentLevelUp as { level: number; levelName: string };
        toast.success(`评测已发布 · 升至 Lv.${u.level} ${u.levelName} 🦞`);
      } else {
        toast.success("评测已发布 🦞");
      }
      setContent("");
      onSuccess();
    } else {
      toast.error(res.message || "发布失败");
    }
  }

  if (gate === "loading") {
    return (
      <div className="border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        加载登录状态…
      </div>
    );
  }

  if (gate === "anon") {
    return (
      <div className="space-y-2 border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
        <p>撰写评测需要先登录。</p>
        <Link
          href="/me?tab=login"
          className="inline-block border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-3 py-1.5 text-[var(--pixel-fg)] underline-offset-2 hover:brightness-95"
        >
          前往特工局登录
        </Link>
      </div>
    );
  }

  if (gate === "noname") {
    return (
      <div className="space-y-2 border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
        <p>请先在特工档案中填写昵称，再撰写评测。</p>
        <Link
          href="/me"
          className="inline-block border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-3 py-1.5 text-[var(--pixel-fg)] underline-offset-2 hover:brightness-95"
        >
          打开特工档案
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 border-2 border-[var(--pixel-border)] bg-[#fffef8] p-4"
    >
      <p className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
        写评测
      </p>
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        以「<span className="text-[var(--pixel-fg)]">{meName}</span>」身份发布（与特工档案昵称一致）
      </p>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">评分</Label>
        <LobsterRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-content" className="font-[family-name:var(--font-pixel-body)]">
          内容
        </Label>
        <PixelTextarea
          id="review-content"
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
        className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
      >
        {pending ? "提交中…" : "提交评测"}
      </Button>
    </form>
  );
}
