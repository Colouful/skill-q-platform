"use client";

import { useEffect } from "react";

const KEY = "xiaqiu-hub-search-history";
const MAX = 8;

export function SearchHistoryRecorder({ q }: { q: string }) {
  useEffect(() => {
    const v = q.trim();
    if (v.length < 2) return;
    try {
      const raw = window.localStorage.getItem(KEY);
      const prev: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      const next = [v, ...prev.filter((x) => x !== v)].slice(0, MAX);
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, [q]);

  return null;
}
