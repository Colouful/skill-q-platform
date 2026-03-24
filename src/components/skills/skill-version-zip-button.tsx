"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadSkillVersionZip } from "@/lib/skill-version-zip-client";

/** 13.7 / 13.8 下载 ZIP 包（与「下载此版本」无外链时逻辑一致） */
export function SkillVersionZipButton({
  slug,
  versionLabel,
}: {
  slug: string;
  versionLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  function downloadZip() {
    setPending(true);
    setProgress(0);
    downloadSkillVersionZip(
      slug,
      versionLabel,
      (ok) => {
        setPending(false);
        setProgress(null);
        if (ok) {
          toast.success("ZIP 已开始下载 🦞");
          router.refresh();
          return;
        }
        toast.error("下载失败");
      },
      (p) => setProgress(p),
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => downloadZip()}
        className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
      >
        {pending ? (progress !== null ? `打包中 ${progress}%` : "打包中…") : "下载 ZIP 包"}
      </Button>
      {pending && progress !== null && (
        <div className="h-2 w-full overflow-hidden border-2 border-[var(--pixel-border)] bg-[#fffef8]">
          <div
            className="h-full bg-[var(--pixel-accent)] transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
