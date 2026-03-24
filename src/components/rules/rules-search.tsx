"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PixelInput } from "@/components/pixel";
import { rulesListHref } from "@/lib/rules-list-url";

export function RulesSearch({
  initialQ,
  categorySlug,
}: {
  initialQ: string;
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
      const next = rulesListHref({
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
        placeholder="搜索 Rule 名称、描述…"
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
