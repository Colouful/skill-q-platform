"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import { apiRulePath } from "@/lib/slug-url";
import { notifyDownloadApiError } from "@/lib/download-toast-client";

type DownloadPayload = {
  version: string;
  downloadUrl: string | null;
  files: unknown;
  versionDownloads: number;
  ruleDownloads: number;
};

export function RuleVersionDownloadButton({
  slug,
  versionLabel,
  initialVersionDownloads,
  compact,
}: {
  slug: string;
  versionLabel: string;
  initialVersionDownloads: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(initialVersionDownloads);

  async function onDownload() {
    setPending(true);
    const verSeg = encodeURIComponent(versionLabel);
    const res = await fetchApi<DownloadPayload>(
      apiRulePath(slug, `/versions/${verSeg}/download`),
      { method: "POST", body: JSON.stringify({}) },
    );
    setPending(false);
    if (res.code !== 0 || !res.data) {
      notifyDownloadApiError(res.message || "记录失败");
      return;
    }
    const d = res.data;
    setCount(d.versionDownloads);
    router.refresh();

    if (d.downloadUrl) {
      window.open(d.downloadUrl, "_blank", "noopener,noreferrer");
      toast.success("已打开下载链接");
      return;
    }
    toast.success(`已记录下载 · 本版 ⬇ ${d.versionDownloads}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() => void onDownload()}
        className={
          compact
            ? "h-8 border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-0 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:bg-[var(--pixel-yellow)]/30"
            : "border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
        }
      >
        {pending ? "…" : "下载"}
      </Button>
      <span className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        ⬇ {count}
      </span>
    </div>
  );
}
