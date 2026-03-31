"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { apiRulePath, rulePath } from "@/lib/slug-url";
import {
  DownloadPolicyRadios,
  type DownloadPolicyChoice,
} from "@/components/hub/download-policy-radios";
import { ProfileCheckboxGroup } from "@/components/hub/profile-checkbox-group";
import { PixelInput, PixelTextarea, pixelSelectClassName } from "@/components/pixel";
import { normalizeDownloadPolicy } from "@/lib/download-policy";
import { sanitizeCatalogSlug } from "@/lib/catalog-slug";
import { readStoredSupportedProfiles } from "@/lib/profile-options";
import type { Category, Rule } from "@/generated/prisma";

export function RuleEditForm({
  rule,
  categories,
  expectedUpdatedAt,
  successRedirectPath,
}: {
  rule: Rule & { category: Category };
  categories: Category[];
  /** 乐观锁：须与当前 Rule.updatedAt 一致 */
  expectedUpdatedAt: string;
  successRedirectPath?: string;
}) {
  const summaryTextareaClassName = "h-24 resize-none overflow-y-auto";
  const detailTextareaClassName = "h-40 resize-none overflow-y-auto";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(rule.name);
  const [slug, setSlug] = useState(rule.slug);
  const [description, setDescription] = useState(rule.description);
  const [author, setAuthor] = useState(rule.author);
  const [categorySlug, setCategorySlug] = useState(rule.category.slug);
  const [longDescription, setLongDescription] = useState(rule.longDescription ?? "");
  const [tags, setTags] = useState(
    Array.isArray(rule.tags)
      ? (rule.tags as unknown[]).filter((t): t is string => typeof t === "string").join(", ")
      : "",
  );
  const [supportedProfiles, setSupportedProfiles] = useState(
    readStoredSupportedProfiles(rule.supportedProfiles).profiles,
  );
  const [downloadPolicy, setDownloadPolicy] = useState<DownloadPolicyChoice>(
    normalizeDownloadPolicy(rule.downloadPolicy),
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const tagList = tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetchApi(apiRulePath(rule.slug), {
      method: "POST",
      body: JSON.stringify({
        name,
        slug,
        description,
        author,
        categorySlug,
        longDescription: longDescription || null,
        tags: tagList,
        supportedProfiles,
        downloadPolicy,
        expectedUpdatedAt,
      }),
    });
    setPending(false);
    if (res.code === 0) {
      toast.success("已保存");
      const nextSlug =
        res.data &&
        typeof res.data === "object" &&
        "slug" in res.data &&
        typeof res.data.slug === "string"
          ? res.data.slug
          : rule.slug;
      router.push(successRedirectPath ?? rulePath(nextSlug));
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
        <Label className="font-[family-name:var(--font-pixel-body)]">唯一标识（Slug）</Label>
        <PixelInput
          required
          value={slug}
          onChange={(e) => setSlug(sanitizeCatalogSlug(e.target.value))}
          placeholder="rule-stock-analysis"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">简介</Label>
        <PixelTextarea
          required
          rows={3}
          className={summaryTextareaClassName}
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
        <Label className="font-[family-name:var(--font-pixel-body)]">适用 Profile</Label>
        <ProfileCheckboxGroup
          value={supportedProfiles}
          onChange={setSupportedProfiles}
          disabled={pending}
        />
      </div>
      <DownloadPolicyRadios
        name="rule-edit-dp"
        value={downloadPolicy}
        onChange={setDownloadPolicy}
      />
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">详细说明</Label>
        <PixelTextarea
          rows={5}
          className={detailTextareaClassName}
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
