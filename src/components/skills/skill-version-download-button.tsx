"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/client-api";
import { notifyDownloadApiError } from "@/lib/download-toast-client";
import { downloadSkillVersionZip } from "@/lib/skill-version-zip-client";
import { apiSkillPath } from "@/lib/slug-url";

type DownloadPayload = {
  version: string;
  downloadUrl: string | null;
  files: unknown;
  versionDownloads: number;
  skillDownloads: number;
};

/**
 * 下载此版本：
 * - 若版本配置了外链 downloadUrl：记录次数并新开页打开；
 * - 否则：与「下载 ZIP 包」相同，从服务端打包 ZIP 并保存（不再只弹 toast）。
 */
export function SkillVersionDownloadButton({
  slug,
  versionLabel,
  downloadUrl: serverDownloadUrl,
  initialVersionDownloads,
}: {
  slug: string;
  versionLabel: string;
  /** 来自数据库；有值时优先打开外链 */
  downloadUrl: string | null;
  initialVersionDownloads: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [zipPct, setZipPct] = useState<number | null>(null);
  const [count, setCount] = useState(initialVersionDownloads);

  async function onDownload() {
    const trimmed = serverDownloadUrl?.trim();
    if (trimmed) {
      setPending(true);
      const verSeg = encodeURIComponent(versionLabel);
      const res = await fetchApi<DownloadPayload>(
        apiSkillPath(slug, `/versions/${verSeg}/download`),
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
      window.open(trimmed, "_blank", "noopener,noreferrer");
      toast.success("已打开下载链接 🦞");
      return;
    }

    setPending(true);
    setZipPct(0);
    downloadSkillVersionZip(
      slug,
      versionLabel,
      (ok, errMsg) => {
        setPending(false);
        setZipPct(null);
        if (ok) {
          toast.success("ZIP 已开始下载 🦞");
          router.refresh();
          return;
        }
        notifyDownloadApiError(errMsg || "打包或下载失败");
      },
      (p) => setZipPct(p),
    );
  }

  const label =
    pending && zipPct !== null ? `打包中 ${zipPct}%` : pending ? "处理中…" : "下载此版本";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        disabled={pending}
        onClick={() => void onDownload()}
        className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
      >
        {label}
      </Button>
      <span className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        本版下载 {count}
      </span>
      {pending && zipPct !== null && (
        <div className="h-2 w-full min-w-[120px] max-w-xs overflow-hidden border-2 border-[var(--pixel-border)] bg-[#fffef8]">
          <div
            className="h-full bg-[var(--pixel-accent)] transition-[width] duration-150"
            style={{ width: `${zipPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
