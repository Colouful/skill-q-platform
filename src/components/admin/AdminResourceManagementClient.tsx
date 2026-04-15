"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PixelInput, pixelSelectClassName } from "@/components/pixel";
import { fetchApi } from "@/lib/client-api";
import { moderationStatusLabel } from "@/lib/moderation";
import { getHubProfileLabel } from "@/lib/profile-options";

type CategoryOption = {
  id: string;
  name: string;
};

type ResourceRow = {
  id: string;
  name: string;
  slug: string;
  registryId: string | null;
  manifestId: string | null;
  categoryId: string;
  categoryName: string;
  tags: string[];
  supportedProfiles: string[];
  moderationStatus: string;
  hasRegistryId: boolean;
  hasManifestId: boolean;
  isCanonicalReady: boolean;
};

type BrowseResponse = {
  items: ResourceRow[];
  total: number;
  page: number;
  pageSize: number;
};

export function AdminResourceManagementClient({
  resourceType,
  categories,
  createHref,
}: {
  resourceType: "skill" | "rule";
  categories: CategoryOption[];
  createHref: string;
}) {
  const [items, setItems] = useState<ResourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [registryStatus, setRegistryStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      resourceType,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (q.trim()) params.set("q", q.trim());
    if (categoryId) params.set("categoryId", categoryId);
    if (registryStatus) params.set("registryStatus", registryStatus);

    void (async () => {
      const res = await fetchApi<BrowseResponse>(
        `/api/admin/resources/browse?${params.toString()}`,
      );
      if (cancelled) return;
      if (res.code !== 0 || !res.data) {
        setItems([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      setItems(res.data.items);
      setTotal(res.data.total);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId, page, pageSize, q, registryStatus, resourceType]);

  const title = resourceType === "skill" ? "Skill 管理" : "Rule 管理";
  const createLabel = resourceType === "skill" ? "新增 Skill" : "新增 Rule";
  const emptyLabel = resourceType === "skill" ? "暂无 Skill" : "暂无 Rule";
  const previewPath = (slug: string) =>
    resourceType === "skill"
      ? `/skills/${encodeURIComponent(slug)}`
      : `/rules/${encodeURIComponent(slug)}`;
  const editPath = (slug: string) =>
    resourceType === "skill"
      ? `/admin/skills/${encodeURIComponent(slug)}/edit`
      : `/admin/rules/${encodeURIComponent(slug)}/edit`;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function formatProfiles(profiles: string[]) {
    if (profiles.length === 0) return getHubProfileLabel("common");
    return profiles.map((profile) => getHubProfileLabel(profile)).join(" / ");
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(qInput);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
            {title}
          </h1>
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            浏览全部资源，并通过后台入口创建新资源。待审流程仍保留在原页面。
          </p>
        </div>
        <Link href={createHref}>
          <Button className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]">
            {createLabel}
          </Button>
        </Link>
      </div>

      <form
        onSubmit={submitSearch}
        className="grid gap-3 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-4 md:grid-cols-[1fr_220px_220px_auto]"
      >
        <PixelInput
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="搜索名称或标识（Slug）"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className={pixelSelectClassName}
        >
          <option value="">全部分类</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={registryStatus}
          onChange={(e) => {
            setRegistryStatus(e.target.value);
            setPage(1);
          }}
          className={pixelSelectClassName}
        >
          <option value="">全部协议状态</option>
          <option value="missing-registry">缺 registryId</option>
          <option value="missing-manifest">缺 manifestId</option>
          <option value="mismatch">协议字段不一致</option>
        </select>
        <Button type="submit" variant="outline" className="border-2 border-[var(--pixel-border)]">
          搜索
        </Button>
      </form>

      <div className="overflow-x-auto border-4 border-[var(--pixel-border)] bg-[#fffef8]">
        <table className="w-full border-collapse text-left font-[family-name:var(--font-pixel-body)] text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/20">
              <th className="w-48 min-w-48 p-2">名称</th>
              <th className="p-2">标识（Slug）</th>
              <th className="p-2">registryId</th>
              <th className="p-2">manifestId</th>
              <th className="w-32 min-w-32 p-2">分类</th>
              <th className="w-28 min-w-28 p-2">Profile</th>
              <th className="p-2">标签</th>
              <th className="w-24 min-w-24 p-2">审核状态</th>
              <th className="w-32 min-w-32 p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-4 text-[var(--pixel-muted)]">
                  载入中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-[var(--pixel-muted)]">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--pixel-border)]/60">
                  <td className="w-48 min-w-48 p-2 text-[var(--pixel-fg)]">{item.name}</td>
                  <td className="p-2 text-[var(--pixel-muted)]">{item.slug}</td>
                  <td className="p-2 text-[var(--pixel-muted)]">
                    {item.registryId || <span className="text-[var(--pixel-accent)]">未设置</span>}
                  </td>
                  <td className="p-2 text-[var(--pixel-muted)]">
                    {item.manifestId || <span className="text-[var(--pixel-accent)]">未设置</span>}
                  </td>
                  <td className="w-32 min-w-32 p-2">{item.categoryName}</td>
                  <td className="w-28 min-w-28 p-2 text-[var(--pixel-muted)] whitespace-nowrap">
                    {formatProfiles(item.supportedProfiles)}
                  </td>
                  <td className="p-2 text-[var(--pixel-muted)]">
                    {item.tags.length > 0 ? item.tags.join(" / ") : "无"}
                  </td>
                  <td className="w-24 min-w-24 p-2 whitespace-nowrap">
                    {moderationStatusLabel(item.moderationStatus)}
                  </td>
                  <td className="w-32 min-w-32 p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={previewPath(item.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center border-2 border-[var(--pixel-border)] px-2 py-1 text-xs hover:bg-[var(--pixel-yellow)]/30"
                      >
                        预览
                      </a>
                      <Link
                        href={editPath(item.slug)}
                        className="inline-flex items-center border-2 border-[var(--pixel-border)] px-2 py-1 text-xs hover:bg-[var(--pixel-cyan)]/20"
                      >
                        编辑
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2 text-sm text-[var(--pixel-muted)]">
        <span>
          共 {total} 条，当前第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-2 border-[var(--pixel-border)]"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-2 border-[var(--pixel-border)]"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
