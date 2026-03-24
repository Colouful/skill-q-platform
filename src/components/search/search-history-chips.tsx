"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchPageHref } from "@/lib/search-page-url";

const KEY = "xiaqiu-hub-search-history";

export function SearchHistoryChips() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      setItems(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        最近搜索
      </span>
      {items.map((t) => (
        <Link
          key={t}
          href={searchPageHref(t, "all")}
          className="border border-[var(--pixel-border)] bg-[#fffef8] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:bg-[var(--pixel-cyan)]/20"
        >
          {t}
        </Link>
      ))}
    </div>
  );
}
