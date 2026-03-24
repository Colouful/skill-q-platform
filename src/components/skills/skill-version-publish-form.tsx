"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { PixelInput, PixelTextarea } from "@/components/pixel";

/** 8.3 发布新版本 */
export function SkillVersionPublishForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [filesJson, setFilesJson] = useState("[]");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isLatest, setIsLatest] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let files: unknown;
    try {
      files = JSON.parse(filesJson || "[]");
    } catch {
      toast.error("文件清单 JSON 格式不正确");
      return;
    }
    if (!Array.isArray(files)) {
      toast.error("files 须为 JSON 数组");
      return;
    }

    setPending(true);
    const res = await fetchApi<{ version: string }>(`/api/skills/${slug}/versions`, {
      method: "POST",
      body: JSON.stringify({
        version: version.trim(),
        changelog: changelog.trim() || undefined,
        files,
        downloadUrl: downloadUrl.trim() || null,
        isLatest,
      }),
    });
    setPending(false);
    if (res.code === 0 && res.data?.version) {
      toast.success("版本已发布 🦞");
      router.push(`/skills/${slug}/versions/${encodeURIComponent(res.data.version)}`);
      router.refresh();
    } else {
      toast.error(res.message || "发布失败");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-4 border-4 border-[var(--pixel-border)] bg-[#fffef8] p-6 shadow-[6px_6px_0_0_var(--pixel-border)]"
    >
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        发布新版本
      </h1>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">版本号</Label>
        <PixelInput
          required
          placeholder="例如 1.1.0"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">更新说明</Label>
        <PixelTextarea value={changelog} onChange={(e) => setChangelog(e.target.value)} rows={4} />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">
          文件清单（JSON 数组，含 name、path，可选 content）
        </Label>
        <PixelTextarea
          value={filesJson}
          onChange={(e) => setFilesJson(e.target.value)}
          rows={8}
          className="font-mono text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-[family-name:var(--font-pixel-body)]">外链下载 URL（可选）</Label>
        <PixelInput
          value={downloadUrl}
          onChange={(e) => setDownloadUrl(e.target.value)}
          placeholder="https://"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 font-[family-name:var(--font-pixel-body)] text-sm">
        <input
          type="checkbox"
          checked={isLatest}
          onChange={(e) => setIsLatest(e.target.checked)}
          className="size-4 border-2 border-[var(--pixel-border)] accent-[var(--pixel-accent)]"
        />
        设为最新版本
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="w-full border-4 border-[var(--pixel-border)] bg-[var(--pixel-accent)] font-[family-name:var(--font-pixel-body)]"
      >
        {pending ? "发布中…" : "发布"}
      </Button>
    </form>
  );
}
