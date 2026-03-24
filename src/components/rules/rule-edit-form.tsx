"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { PixelInput, PixelTextarea, pixelSelectClassName } from "@/components/pixel";
import type { Category, Rule } from "@/generated/prisma";

export function RuleEditForm({
  rule,
  categories,
  expectedUpdatedAt,
}: {
  rule: Rule & { category: Category };
  categories: Category[];
  /** 乐观锁：须与当前 Rule.updatedAt 一致 */
  expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(rule.name);
  const [description, setDescription] = useState(rule.description);
  const [author, setAuthor] = useState(rule.author);
  const [categorySlug, setCategorySlug] = useState(rule.category.slug);
  const [longDescription, setLongDescription] = useState(rule.longDescription ?? "");
  const [tags, setTags] = useState(
    Array.isArray(rule.tags)
      ? (rule.tags as unknown[])
          .filter((t): t is string => typeof t === "string")
          .join(", ")
      : "",
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const tagList = tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetchApi(`/api/rules/${rule.slug}`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        author,
        categorySlug,
        longDescription: longDescription || null,
        tags: tagList,
        expectedUpdatedAt,
      }),
    });
    setPending(false);
    if (res.code === 0) {
      toast.success("已保存");
      router.push(`/rules/${rule.slug}`);
      router.refresh();
    } else {
      toast.error(res.message || "保存失败");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-4 border-4 border-[var(--rule-border)] bg-[#fffef8] p-6 shadow-[6px_6px_0_0_var(--rule-shadow)]"
    >
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        编辑 Rule
      </h1>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">名称</Label>
        <PixelInput required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">简介</Label>
        <PixelTextarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">作者</Label>
        <PixelInput required value={author} onChange={(e) => setAuthor(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">分类</Label>
        <select
          required
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className={pixelSelectClassName}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">详细说明</Label>
        <PixelTextarea
          rows={5}
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">标签（逗号分隔）</Label>
        <PixelInput value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-lg text-[var(--pixel-fg)] shadow-[var(--hub-shadow-card-skill)] hover:bg-[var(--pixel-yellow)]"
      >
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
