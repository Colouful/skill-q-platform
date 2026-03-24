"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { postJsonWithUploadProgress } from "@/lib/client-api";
import { validateRulePackage } from "@/lib/rule-package-validator";
import type { Category } from "@/generated/prisma";
import { RuleZipDropzone } from "@/components/rules/rule-zip-dropzone";
import { PixelInput, PixelTextarea, pixelSelectClassName } from "@/components/pixel";

export function RuleUploadForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");
  const [longDescription, setLongDescription] = useState("");
  const [tags, setTags] = useState("");
  const [zipFiles, setZipFiles] = useState<
    { name: string; path: string; content: string }[] | null
  >(null);
  const [ruleMdPreview, setRuleMdPreview] = useState("");
  const [submitPct, setSubmitPct] = useState<number | null>(null);

  if (categories.length === 0) {
    return (
      <p className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
        暂无 Rule 分类，请先执行 <code className="text-[var(--pixel-fg)]">npx prisma db seed</code>
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tagList = tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const pkg = validateRulePackage(zipFiles ?? undefined);
    if (!pkg.ok) {
      toast.error(pkg.errors.join("；"));
      return;
    }
    for (const w of pkg.warnings) {
      toast.message(w, { duration: 4000 });
    }

    setPending(true);
    setSubmitPct(0);
    const body = {
      name,
      description,
      author,
      categorySlug,
      longDescription: longDescription || undefined,
      tags: tagList.length ? tagList : undefined,
      initialFiles: zipFiles && zipFiles.length > 0 ? zipFiles : undefined,
    };

    try {
      const res = await postJsonWithUploadProgress<{ rule: { slug: string }; agentLevelUp: unknown }>(
        "/api/rules",
        body,
        (p) => setSubmitPct(p),
      );
      const slug = res.data?.rule?.slug;
      if (res.code === 0 && slug) {
        if (res.data?.agentLevelUp) {
          const u = res.data.agentLevelUp as { level: number; levelName: string };
          toast.success(`Rule 创建成功 · 升至 Lv.${u.level} ${u.levelName} 🦞`);
        } else {
          toast.success("Rule 创建成功 🦞");
        }
        router.push(`/rules/${slug}`);
      } else {
        toast.error(res.message || "创建失败");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提交失败");
    } finally {
      setPending(false);
      setSubmitPct(null);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-6 shadow-[6px_6px_0_0_var(--pixel-border)]"
    >
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        上传 Rule
      </h1>

      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">从 ZIP 导入（可选）</Label>
        <RuleZipDropzone
          onParsed={(p) => {
            setZipFiles(p.files);
            setRuleMdPreview(p.body || "");
            if (p.hints.name) setName((n) => n || p.hints.name!);
            if (p.hints.description) setDescription((d) => d || p.hints.description!);
            if (p.body) setLongDescription((l) => l || p.body);
            if (p.issues.length) {
              toast.message(p.issues.join("；"), { duration: 6000 });
            }
          }}
        />
        {zipFiles && zipFiles.length > 0 && (
          <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--rule-accent)]">
            已载入 {zipFiles.length} 个文件，提交后将写入版本 1.0.0
          </p>
        )}
        {ruleMdPreview.trim().length > 0 && (
          <div className="space-y-1">
            <p className="font-[family-name:var(--font-pixel-body)] text-xs font-medium text-[var(--rule-accent)]">
              RULE.md 正文预览
            </p>
            <div className="max-h-56 overflow-y-auto border-2 border-[var(--rule-border)] bg-[#fffef8] p-3 text-left text-sm text-[var(--pixel-fg)] [&_a]:text-[var(--rule-accent)] [&_code]:rounded [&_code]:bg-black/5 [&_pre]:overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{ruleMdPreview}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">名称</Label>
        <PixelInput
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#fffef8]"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">简介</Label>
        <PixelTextarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-[#fffef8]"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">作者</Label>
        <PixelInput
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="bg-[#fffef8]"
        />
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
        <Label className="font-[family-name:var(--font-pixel-body)]">详细说明（可选）</Label>
        <PixelTextarea
          rows={5}
          value={longDescription}
          onChange={(e) => setLongDescription(e.target.value)}
          className="bg-[#fffef8]"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">标签（逗号分隔）</Label>
        <PixelInput
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="cli, git, demo"
          className="bg-[#fffef8]"
        />
      </div>
      {submitPct != null && (
        <div
          className="h-2 w-full overflow-hidden border-2 border-[var(--rule-border)] bg-[#fffef8]"
          role="progressbar"
          aria-valuenow={submitPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[var(--pixel-yellow)] transition-[width] duration-150"
            style={{ width: `${submitPct}%` }}
          />
        </div>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-lg text-[var(--pixel-fg)] shadow-[var(--hub-shadow-card-skill)] hover:bg-[var(--pixel-yellow)]"
      >
        {pending ? (submitPct != null ? `提交中 ${submitPct}%` : "提交中…") : "创建"}
      </Button>
    </form>
  );
}
