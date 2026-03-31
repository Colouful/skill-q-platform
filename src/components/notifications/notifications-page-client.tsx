"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import { formatDateTimeShanghai } from "@/lib/date-format";

type Row = {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationsPageClient() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchApi<{ items: Row[]; total: number }>(
      `/api/notifications?page=${page}&pageSize=30`,
    );
    setLoading(false);
    if (res.code === 401) {
      toast.error("请先登录");
      router.push("/login");
      return;
    }
    if (res.code !== 0 || !res.data) {
      toast.error(res.message || "加载失败");
      return;
    }
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [page, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    const res = await fetchApi(`/api/notifications/${id}/read`, { method: "POST", body: JSON.stringify({}) });
    if (res.code !== 0) {
      toast.error(res.message || "操作失败");
      return;
    }
    void load();
    router.refresh();
  }

  async function readAll() {
    const res = await fetchApi("/api/notifications/read-all", { method: "POST", body: JSON.stringify({}) });
    if (res.code !== 0) {
      toast.error(res.message || "操作失败");
      return;
    }
    toast.success("已全部标为已读");
    void load();
    router.refresh();
  }

  if (loading && items.length === 0) {
    return <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">加载中…</p>;
  }

  const totalPages = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="border-2" onClick={() => void readAll()}>
          全部标为已读
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">暂无通知</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`border-4 border-[var(--pixel-border)] p-3 font-[family-name:var(--font-pixel-body)] text-sm ${
                n.isRead ? "bg-black/[0.02]" : "bg-[var(--pixel-cyan)]/10"
              }`}
            >
              <p className="font-medium text-[var(--pixel-fg)]">{n.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--pixel-muted)]">{n.content}</p>
              <p className="mt-2 text-xs text-[var(--pixel-muted)]">
                {formatDateTimeShanghai(n.createdAt)} · {n.type}
              </p>
              {!n.isRead && (
                <Button type="button" size="sm" variant="outline" className="mt-2 h-7 border px-2 text-xs" onClick={() => void markRead(n.id)}>
                  标为已读
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          上一页
        </Button>
        <span>
          {page} / {totalPages}（共 {total} 条）
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
