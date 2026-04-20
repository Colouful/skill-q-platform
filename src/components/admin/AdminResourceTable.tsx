"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";

type Row = {
  id: string;
  name: string;
  slug: string;
  author: string;
  category: { name: string };
};

export function AdminResourceTable({ type, items }: { type: "skill" | "rule"; items: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const base = type === "skill" ? "/api/admin/skills" : "/api/admin/rules";

  async function approve(id: string) {
    setBusy(id);
    const res = await fetchApi<unknown>(`${base}/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "操作失败");
      return;
    }
    toast.success(type === "skill" ? "Skill 已通过" : "Rule 已通过");
    router.refresh();
  }

  async function reject(id: string) {
    const note = window.prompt("拒绝原因（可选）", "") ?? "";
    setBusy(id);
    const res = await fetchApi<unknown>(`${base}/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note: note.trim() || undefined }),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "操作失败");
      return;
    }
    toast.success("已拒绝");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">暂无待审核项</p>
    );
  }

  return (
    <div className="overflow-x-auto border-4 border-[var(--pixel-border)] bg-[#fffef8]">
      <table className="w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm">
        <thead>
          <tr className="border-b-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/20">
            <th className="p-2">名称</th>
            <th className="p-2">Slug</th>
            <th className="p-2">作者</th>
            <th className="p-2">分类</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b border-[var(--pixel-border)]/60">
              <td className="p-2 text-[var(--pixel-fg)]">{r.name}</td>
              <td className="p-2 text-[var(--pixel-muted)]">{r.slug}</td>
              <td className="p-2 text-[var(--pixel-muted)]">{r.author}</td>
              <td className="p-2">{r.category.name}</td>
              <td className="flex flex-wrap gap-2 p-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy === r.id}
                  className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)]"
                  onClick={() => void approve(r.id)}
                >
                  通过
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy === r.id}
                  className="border-2 border-[var(--pixel-border)]"
                  onClick={() => void reject(r.id)}
                >
                  拒绝
                </Button>
                <a
                  href={type === "skill" ? `/skills/${encodeURIComponent(r.slug)}` : `/rules/${encodeURIComponent(r.slug)}`}
                  className="inline-flex items-center border-2 border-[var(--pixel-border)] px-2 py-1 text-xs hover:bg-[var(--pixel-yellow)]/30"
                  target="_blank"
                  rel="noreferrer"
                >
                  前台预览
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
