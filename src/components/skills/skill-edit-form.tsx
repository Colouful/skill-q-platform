"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import {
  DownloadPolicyRadios,
  type DownloadPolicyChoice,
} from "@/components/hub/download-policy-radios";
import { PixelInput, PixelTextarea, pixelSelectClassName } from "@/components/pixel";
import { normalizeDownloadPolicy } from "@/lib/download-policy";
import type { Category, Skill } from "@/generated/prisma";

/** 4.7 编辑 Skill */
export function SkillEditForm({
  skill,
  categories,
  expectedUpdatedAt,
}: {
  skill: Skill & { category: Category };
  categories: Category[];
  expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(skill.name);
  const [description, setDescription] = useState(skill.description);
  const [author, setAuthor] = useState(skill.author);
  const [categorySlug, setCategorySlug] = useState(skill.category.slug);
  const [longDescription, setLongDescription] = useState(skill.longDescription ?? "");
  const [tags, setTags] = useState(
    Array.isArray(skill.tags)
      ? (skill.tags as unknown[])
          .filter((t): t is string => typeof t === "string")
          .join(", ")
      : "",
  );
  const [downloadPolicy, setDownloadPolicy] = useState<DownloadPolicyChoice>(
    normalizeDownloadPolicy(skill.downloadPolicy),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const tagList = tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetchApi(`/api/skills/${skill.slug}`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        author,
        categorySlug,
        longDescription: longDescription || null,
        tags: tagList,
        downloadPolicy,
        expectedUpdatedAt,
      }),
    });
    setPending(false);
    if (res.code === 0) {
      toast.success("已保存 🦞");
      router.push(`/skills/${skill.slug}`);
      router.refresh();
    } else {
      toast.error(res.message || "保存失败");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-6 shadow-[6px_6px_0_0_var(--pixel-border)]"
    >
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        编辑 Skill
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
      <DownloadPolicyRadios
        name="skill-edit-dp"
        value={downloadPolicy}
        onChange={setDownloadPolicy}
      />
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
