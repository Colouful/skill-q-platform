"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { PixelInput, PixelSelect, PixelTextarea } from "@/components/pixel";
import { cn } from "@/lib/utils";
import { AdminBulkResourceCategoryDialog } from "@/components/admin/AdminBulkResourceCategoryDialog";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  resourceType: string;
  sortOrder: number;
  _count: { skills: number; rules: number };
};

type Tab = "skill" | "rule";

export function AdminCategoriesClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("skill");
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [migrateToId, setMigrateToId] = useState("");

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSelected, setMergeSelected] = useState<Set<string>>(new Set());
  const [mergeTargetId, setMergeTargetId] = useState("");

  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrateFrom, setMigrateFrom] = useState<CategoryRow | null>(null);
  const [migrateTo, setMigrateTo] = useState("");
  const [keepSource, setKeepSource] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchApi<{ items: CategoryRow[] }>(
      `/api/admin/categories?resourceType=${tab}`,
    );
    setLoading(false);
    if (res.code !== 0 || !res.data?.items) {
      toast.error(res.message || "加载失败");
      return;
    }
    setItems(res.data.items);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setBulkOpen(false);
  }, [tab]);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setIcon("");
    setFormOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    setName(row.name);
    setSlug(row.slug);
    setDescription(row.description ?? "");
    setIcon(row.icon ?? "");
    setFormOpen(true);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy("form");
    if (editing) {
      const res = await fetchApi("/api/admin/categories/update", {
        method: "POST",
        body: JSON.stringify({
          id: editing.id,
          name,
          slug,
          description: description || null,
          icon: icon || null,
        }),
      });
      setBusy(null);
      if (res.code !== 0) {
        toast.error(res.message || "保存失败");
        return;
      }
      toast.success("已保存");
    } else {
      const res = await fetchApi("/api/admin/categories/create", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          icon: icon || null,
          resourceType: tab,
        }),
      });
      setBusy(null);
      if (res.code !== 0) {
        toast.error(res.message || "创建失败");
        return;
      }
      toast.success("已创建");
    }
    setFormOpen(false);
    router.refresh();
    void load();
  }

  function openDelete(row: CategoryRow) {
    setDeleteTarget(row);
    setMigrateToId("");
    setDeleteOpen(true);
  }

  async function confirmDelete(
    mode: "rejectIfNotEmpty" | "migrateFirst" | "cascadeDeleteResources",
  ) {
    if (!deleteTarget) return;
    if (mode === "migrateFirst" && !migrateToId) {
      toast.error("请选择目标分类");
      return;
    }
    if (mode === "cascadeDeleteResources") {
      const ok = window.confirm(
        `将永久删除该分类下全部 ${tab === "skill" ? "Skill" : "Rule"} 及版本数据，且不可恢复。确定？`,
      );
      if (!ok) return;
    }
    setBusy(deleteTarget.id);
    const body: Record<string, unknown> = {
      categoryId: deleteTarget.id,
      mode,
    };
    if (mode === "migrateFirst") body.targetCategoryId = migrateToId;
    if (mode === "cascadeDeleteResources") body.confirmCascade = true;

    const res = await fetchApi("/api/admin/categories/remove", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "删除失败");
      return;
    }
    toast.success("已处理");
    setDeleteOpen(false);
    setDeleteTarget(null);
    router.refresh();
    void load();
  }

  async function moveRow(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const t = next[index]!;
    next[index] = next[j]!;
    next[j] = t;
    const orderedIds = next.map((r) => r.id);
    setBusy("reorder");
    const res = await fetchApi("/api/admin/categories/reorder", {
      method: "POST",
      body: JSON.stringify({ resourceType: tab, orderedIds }),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "排序失败");
      void load();
      return;
    }
    toast.success("排序已更新");
    setItems(next);
    router.refresh();
  }

  function toggleMerge(id: string) {
    setMergeSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function runMerge() {
    const sources = [...mergeSelected].filter((id) => id !== mergeTargetId);
    if (!mergeTargetId || sources.length === 0) {
      toast.error("请选择源分类与目标分类");
      return;
    }
    setBusy("merge");
    const res = await fetchApi("/api/admin/categories/merge", {
      method: "POST",
      body: JSON.stringify({
        resourceType: tab,
        sourceCategoryIds: sources,
        targetCategoryId: mergeTargetId,
        deleteSources: true,
      }),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "合并失败");
      return;
    }
    toast.success("合并完成");
    setMergeOpen(false);
    setMergeSelected(new Set());
    setMergeTargetId("");
    void load();
  }

  function openMigrate(row: CategoryRow) {
    setMigrateFrom(row);
    setMigrateTo("");
    setKeepSource(false);
    setMigrateOpen(true);
  }

  async function runMigrate() {
    if (!migrateFrom || !migrateTo) {
      toast.error("请选择目标分类");
      return;
    }
    setBusy("migrate");
    const res = await fetchApi("/api/admin/categories/migrate-resources", {
      method: "POST",
      body: JSON.stringify({
        fromCategoryId: migrateFrom.id,
        toCategoryId: migrateTo,
        resourceType: tab,
        keepSourceCategory: keepSource,
      }),
    });
    setBusy(null);
    if (res.code !== 0) {
      toast.error(res.message || "迁移失败");
      return;
    }
    toast.success("迁移完成");
    setMigrateOpen(false);
    void load();
  }

  const countFor = (r: CategoryRow) => (tab === "skill" ? r._count.skills : r._count.rules);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          类型
        </span>
        {(["skill", "rule"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn(
              "border-2 px-3 py-1 font-[family-name:var(--font-pixel-body)] text-sm",
              tab === t
                ? "border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/30"
                : "border-transparent hover:border-[var(--pixel-border)]/50",
            )}
            onClick={() => setTab(t)}
          >
            {t === "skill" ? "Skill 分类" : "Rule 分类"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]"
          onClick={openCreate}
        >
          新建分类
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-2"
          onClick={() => setMergeOpen(true)}
        >
          合并分类…
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-2"
          onClick={() => setBulkOpen(true)}
        >
          批量改资源分类…
        </Button>
      </div>

      {loading ? (
        <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
          加载中…
        </p>
      ) : (
        <div className="overflow-x-auto border-4 border-[var(--pixel-border)]">
          <table className="w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--pixel-border)] bg-black/5">
                <th className="p-2">排序</th>
                <th className="p-2">名称</th>
                <th className="p-2">Slug</th>
                <th className="p-2">资源数</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={row.id} className="border-b border-[var(--pixel-border)]/50">
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="border px-1 text-xs"
                        disabled={busy !== null || i === 0}
                        onClick={() => void moveRow(i, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="border px-1 text-xs"
                        disabled={busy !== null || i === items.length - 1}
                        onClick={() => void moveRow(i, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    {row.icon ? <span className="mr-1">{row.icon}</span> : null}
                    {row.name}
                  </td>
                  <td className="p-2 text-[var(--pixel-muted)]">{row.slug}</td>
                  <td className="p-2">{countFor(row)}</td>
                  <td className="flex flex-wrap gap-1 p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border px-2 text-xs"
                      onClick={() => openEdit(row)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border px-2 text-xs"
                      disabled={busy !== null}
                      onClick={() => openMigrate(row)}
                    >
                      迁移资源
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 border px-2 text-xs text-red-700"
                      disabled={busy !== null}
                      onClick={() => openDelete(row)}
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md border-4 border-[var(--pixel-border)] bg-[#fffef8]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-pixel-heading)]">
              {editing ? "编辑分类" : "新建分类"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveForm} className="space-y-3">
            <div>
              <Label>名称</Label>
              <PixelInput
                clearable
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <PixelInput
                clearable
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div>
              <Label>描述</Label>
              <PixelTextarea
                clearable
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>图标（emoji 或短文本）</Label>
              <PixelInput clearable value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy === "form"} className="border-2">
                {busy === "form" ? "提交中…" : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md border-4 border-[var(--pixel-border)] bg-[#fffef8]">
          <DialogHeader>
            <DialogTitle>删除分类</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-3 font-[family-name:var(--font-pixel-body)] text-sm">
              <p>
                「{deleteTarget.name}」下有 <strong>{countFor(deleteTarget)}</strong> 个
                {tab === "skill" ? "Skill" : "Rule"}。
              </p>
              {countFor(deleteTarget) === 0 ? (
                <Button
                  className="w-full border-2"
                  onClick={() => void confirmDelete("rejectIfNotEmpty")}
                >
                  确认删除空分类
                </Button>
              ) : (
                <>
                  <div>
                    <Label>将资源迁移到</Label>
                    <PixelSelect
                      clearable
                      className="mt-1 w-full"
                      value={migrateToId}
                      onChange={(e) => setMigrateToId(e.target.value)}
                    >
                      <option value="">选择目标分类</option>
                      {items
                        .filter((r) => r.id !== deleteTarget.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.slug})
                          </option>
                        ))}
                    </PixelSelect>
                  </div>
                  <Button
                    className="w-full border-2"
                    onClick={() => void confirmDelete("migrateFirst")}
                  >
                    迁移并删除分类
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-red-800 text-red-800"
                    onClick={() => void confirmDelete("cascadeDeleteResources")}
                  >
                    危险：删除分类及全部资源
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-lg border-4 border-[var(--pixel-border)] bg-[#fffef8]">
          <DialogHeader>
            <DialogTitle>合并分类</DialogTitle>
          </DialogHeader>
          <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
            勾选若干源分类，再选目标分类；源下的全部资源会移到目标，源分类将被删除。
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {items.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={mergeSelected.has(r.id)}
                  onChange={() => toggleMerge(r.id)}
                />
                {r.name}（{countFor(r)}）
              </label>
            ))}
          </div>
          <div>
            <Label>合并到</Label>
            <PixelSelect
              clearable
              className="mt-1 w-full"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
            >
              <option value="">目标分类</option>
              {items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </PixelSelect>
          </div>
          <DialogFooter>
            <Button type="button" disabled={busy === "merge"} onClick={() => void runMerge()}>
              执行合并
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminBulkResourceCategoryDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        tab={tab}
        categories={items.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))}
        onApplied={() => {
          void load();
          router.refresh();
        }}
      />

      <Dialog open={migrateOpen} onOpenChange={setMigrateOpen}>
        <DialogContent className="max-w-md border-4 border-[var(--pixel-border)] bg-[#fffef8]">
          <DialogHeader>
            <DialogTitle>迁移资源</DialogTitle>
          </DialogHeader>
          {migrateFrom && (
            <div className="space-y-3">
              <p className="text-sm">从「{migrateFrom.name}」迁移到：</p>
              <PixelSelect
                clearable
                className="w-full"
                value={migrateTo}
                onChange={(e) => setMigrateTo(e.target.value)}
              >
                <option value="">选择目标</option>
                {items
                  .filter((r) => r.id !== migrateFrom.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </PixelSelect>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={keepSource}
                  onChange={(e) => setKeepSource(e.target.checked)}
                />
                保留空分类（不删源分类）
              </label>
              <Button type="button" onClick={() => void runMigrate()}>
                执行迁移
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
