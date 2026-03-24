"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

const REFRESH_MS = 30_000;

export function AdminDashboardRefreshBar() {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-dashed border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2">
      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        数据每 {REFRESH_MS / 1000} 秒自动刷新（概览与图表）
      </p>
      <button
        type="button"
        onClick={refresh}
        className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-3 py-1 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-95"
      >
        立即刷新
      </button>
    </div>
  );
}
