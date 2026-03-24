"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PixelInput } from "@/components/pixel";
import { skillsListHref } from "@/lib/skills-list-url";

/** 4.4 实时搜索：防抖更新 URL 查询参数，触发服务端列表刷新 */
export function SkillsSearch({
  initialQ,
  categorySlug,
}: {
  initialQ: string;
  /** 与分类筛选同时存在时保留在 URL */
  categorySlug?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [pending, startTransition] = useTransition();
  const skipFirst = useRef(true);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      const v = q.trim();
      const next = skillsListHref({
        q: v || undefined,
        category: categorySlug,
        page: undefined,
      });
      startTransition(() => {
        router.replace(next);
      });
    }, 360);
    return () => window.clearTimeout(t);
  }, [q, router, categorySlug]);

  return (
    <div className="relative w-full max-w-md">
      <PixelInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索名称、描述…"
        className="bg-[#fffef8]"
        aria-busy={pending}
      />
      {pending && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          …
        </span>
      )}
    </div>
  );
}
