"use client";

import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getHubActorFromStorage } from "@/lib/hub-actor-client";
import type { ZipParsePayload } from "@/components/skills/skill-zip-dropzone";

/** Rule 包：解析 RULE.md，POST /api/upload 时带 kind=rule；支持 ZIP 上传进度 */
export function RuleZipDropzone({
  onParsed,
}: {
  onParsed: (p: ZipParsePayload) => void;
}) {
  const id = useId();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const parseFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("请上传 .zip 格式的 Rule 包");
        return;
      }
      setBusy(true);
      setProgress(0);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "rule");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      const actor = getHubActorFromStorage();
      if (actor) xhr.setRequestHeader("X-Hub-Actor", actor);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
        }
      };
      xhr.onload = () => {
        setBusy(false);
        setProgress(null);
        let json: {
          code: number;
          message?: string;
          data?: {
            files: { name: string; path: string; content: string }[];
            hints: { name?: string; description?: string };
            body: string;
            issues: string[];
            objectStorage?: ZipParsePayload["objectStorage"];
          };
        };
        try {
          json = JSON.parse(xhr.responseText) as typeof json;
        } catch {
          toast.error("解析响应失败");
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300 || json.code !== 0 || !json.data) {
          toast.error(json.message || "解析失败");
          return;
        }
        const d = json.data;
        onParsed({
          files: d.files,
          hints: d.hints ?? {},
          body: d.body ?? "",
          issues: d.issues ?? [],
          objectStorage: d.objectStorage,
        });
        const os = d.objectStorage;
        if (os?.stored) {
          toast.success("ZIP 解析完成，已写入对象存储 🦞");
        } else {
          toast.success("ZIP 解析完成 🦞");
          if (os?.reason === "error" && os.message) {
            toast.message(`对象存储备份失败：${os.message}`, { duration: 5000 });
          }
        }
      };
      xhr.onerror = () => {
        setBusy(false);
        setProgress(null);
        toast.error("上传失败");
      };
      xhr.send(fd);
    },
    [onParsed],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) parseFile(f);
      }}
    >
      <input
        id={id}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parseFile(f);
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border-4 border-dashed px-4 py-8 text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] transition",
          drag
            ? "border-[var(--rule-accent)] bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]"
            : "border-[var(--rule-border)] bg-[#fffef8] hover:border-[var(--rule-accent)]/60",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <span className="text-[var(--pixel-fg)]">
          {busy ? `上传中…${progress != null ? ` ${progress}%` : ""}` : "拖拽 Rule ZIP 到此处，或点击选择"}
        </span>
        <span className="text-xs">需包含 RULE.md；单包 ≤10MB</span>
        {busy && progress != null && (
          <div
            className="h-2 w-full max-w-xs overflow-hidden border-2 border-[var(--rule-border)] bg-[#fffef8]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[var(--pixel-yellow)] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </label>
    </div>
  );
}
