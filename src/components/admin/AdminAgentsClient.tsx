"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PixelInput, pixelSelectClassName } from "@/components/pixel";
import { fetchApi } from "@/lib/client-api";
import { Label } from "@/components/ui/label";

type Row = {
  id: string;
  name: string;
  slug: string;
  agentType: string;
  level: number;
  levelName: string;
  isActive: boolean;
  registeredAt: string;
  lastActiveAt: string | null;
  uploadsCount: number;
  downloadsCount: number;
};

export function AdminAgentsClient() {
  const router = useRouter();
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [qInput, setQInput] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      filter,
    });
    if (qApplied.trim()) params.set("q", qApplied.trim());
    const res = await fetchApi<{ items: Row[]; total: number }>(`/api/admin/agents?${params.toString()}`);
    setLoading(false);
    if (res.code !== 0 || !res.data) {
      toast.error(res.message || "加载失败");
      return;
    }
    setItems(res.data.items);
    setTotal(res.data.total);
  }, [page, filter, qApplied]);

  useEffect(() => {
    void load();
  }, [load]);

  function applySearch() {
    setQApplied(qInput);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <Label className="text-xs">关键词（名称 / Slug）</Label>
          <PixelInput value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="可选" />
        </div>
        <div>
          <Label className="text-xs">状态</Label>
          <select
            className={pixelSelectClassName + " mt-1 block"}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as "all" | "active" | "inactive");
              setPage(1);
            }}
          >
            <option value="all">全部</option>
            <option value="active">正常</option>
            <option value="inactive">已封禁</option>
          </select>
        </div>
        <Button type="button" variant="outline" className="border-2" onClick={applySearch}>
          搜索
        </Button>
      </div>

      {loading ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">加载中…</p>
      ) : (
        <>
          <div className="overflow-x-auto border-4 border-[var(--pixel-border)]">
            <table className="w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/20">
                  <th className="p-2">名称</th>
                  <th className="p-2">Slug</th>
                  <th className="p-2">等级</th>
                  <th className="p-2">状态</th>
                  <th className="p-2">上传/下载</th>
                  <th className="p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--pixel-border)]/50">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-[var(--pixel-muted)]">{r.slug}</td>
                    <td className="p-2">
                      Lv.{r.level} {r.levelName}
                    </td>
                    <td className="p-2">{r.isActive ? "正常" : "已封禁"}</td>
                    <td className="p-2">
                      {r.uploadsCount} / {r.downloadsCount}
                    </td>
                    <td className="p-2">
                      <Link
                        href={`/admin/agents/${r.id}`}
                        className="underline font-[family-name:var(--font-pixel-body)] text-sm"
                      >
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              上一页
            </Button>
            <span>
              {page} / {totalPages}（共 {total} 人）
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
            <Button type="button" size="sm" variant="outline" onClick={() => router.refresh()}>
              刷新
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
