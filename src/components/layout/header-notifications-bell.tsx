"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { fetchApi } from "@/lib/client-api";
import { cn } from "@/lib/utils";

/** 仅登录用户展示；未登录不占位 */
export function HeaderNotificationsBell({ className }: { className?: string }) {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const res = await fetchApi<{ count: number }>("/api/notifications/unread-count");
      if (cancelled) return;
      if (res.code === 401) {
        setShow(false);
        return;
      }
      if (res.code === 0 && res.data) {
        setShow(true);
        setCount(res.data.count);
      }
    };
    void tick();
    const id = window.setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!show) {
    return null;
  }

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-sm border-4 border-[var(--pixel-border)] bg-[#fffef8] text-[var(--pixel-fg)] shadow-[2px_2px_0_0_var(--pixel-border)] transition hover:bg-[var(--pixel-cyan)]/25",
        className,
      )}
      aria-label="通知"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] px-1 font-[family-name:var(--font-pixel-body)] text-[10px] leading-none text-[var(--pixel-fg)]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
