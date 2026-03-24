"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApi } from "@/lib/client-api";
import { PixelInput, pixelSelectClassName } from "@/components/pixel";

type CategoryRow = { id: string; name: string; slug: string };

type BrowseRow = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  moderationStatus: string;
};

type Tab = "skill" | "rule";

export function AdminBulkResourceCategoryDialog({
  open,
  onOpenChange,
  tab,
  categories,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: Tab;
  categories: CategoryRow[];
  onApplied: () => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [qInput, setQInput] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [rows, setRows] = useState<BrowseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      resourceType: tab,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filterCat) params.set("categoryId", filterCat);
    if (qApplied.trim()) params.set("q", qApplied.trim());
    const res = await fetchApi<{
      items: BrowseRow[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/admin/resources/browse?${params.toString()}`);
    setLoading(false);
    if (res.code !== 0 || !res.data?.items) {
      toast.error(res.message || "加载失败");
      return;
    }
    setRows(res.data.items);
    setTotal(res.data.total);
  }, [tab, page, filterCat, qApplied]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setPage(1);
      setQInput("");
      setQApplied("");
      setFilterCat("");
      setSelected(new Set());
      setTargetId("");
    }
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectPageAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const r of rows) n.add(r.id);
      return n;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function apply() {
    if (!targetId) {
      toast.error("请选择目标分类");
      return;
    }
    const ids = [...selected];
    if (ids.length === 0) {
      toast.error("请至少勾选一个资源");
      return;
    }
    setSubmitting(true);
    const res = await fetchApi<{ success: number; failed: number }>(
      "/api/admin/resources/bulk-update-category",
      {
        method: "POST",
        body: JSON.stringify({
          resourceType: tab,
          resourceIds: ids,
          targetCategoryId: targetId,
        }),
      },
    );
    setSubmitting(false);
    if (res.code !== 0) {
      toast.error(res.message || "更新失败");
      return;
    }
    const ok = res.data?.success ?? 0;
    const bad = res.data?.failed ?? 0;
    toast.success(bad > 0 ? `成功 ${ok} 条，失败 ${bad} 条` : `成功更新 ${ok} 条`);
    onApplied();
    onOpenChange(false);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-4 border-[var(--pixel-border)] bg-[#fffef8]">
        <DialogHeader>
          <DialogTitle>批量修改资源分类</DialogTitle>
        </DialogHeader>
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
          按筛选与分页浏览，勾选后统一到目标分类（{tab === "skill" ? "Skill" : "Rule"}）。
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px] flex-1">
            <Label className="text-xs">关键词（名称 / Slug）</Label>
            <PixelInput value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="可选" />
          </div>
          <div className="min-w-[140px]">
            <Label className="text-xs">按分类筛选</Label>
            <select
              className={pixelSelectClassName + " mt-1 w-full"}
              value={filterCat}
              onChange={(e) => {
                setFilterCat(e.target.value);
                setPage(1);
              }}
            >
              <option value="">全部</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-2"
            onClick={() => {
              setQApplied(qInput);
              setPage(1);
            }}
          >
            搜索
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>已选 {selected.size} 条</span>
          <Button type="button" size="sm" variant="outline" className="h-7 border px-2 text-xs" onClick={selectPageAll}>
            全选当页
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 border px-2 text-xs" onClick={clearSelection}>
            清空选择
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto border-2 border-[var(--pixel-border)]">
          {loading ? (
            <p className="p-2 text-sm text-[var(--pixel-muted)]">加载中…</p>
          ) : rows.length === 0 ? (
            <p className="p-2 text-sm text-[var(--pixel-muted)]">无数据</p>
          ) : (
            <table className="w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm">
              <thead>
                <tr className="border-b border-[var(--pixel-border)] bg-black/5">
                  <th className="p-1 w-8" />
                  <th className="p-1">名称</th>
                  <th className="p-1">Slug</th>
                  <th className="p-1">当前分类</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--pixel-border)]/40">
                    <td className="p-1">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="p-1">{r.name}</td>
                    <td className="p-1 text-[var(--pixel-muted)]">{r.slug}</td>
                    <td className="p-1">{r.categoryName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
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
        <div>
          <Label>目标分类</Label>
          <select
            className={pixelSelectClassName + " mt-1 w-full"}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">请选择</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（{c.slug}）
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button type="button" disabled={submitting} className="border-2" onClick={() => void apply()}>
            {submitting ? "提交中…" : "批量更新分类"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
