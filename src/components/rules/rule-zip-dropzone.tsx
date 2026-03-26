"use client";

import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { encodeHubActorForRequestHeader, getHubActorFromStorage } from "@/lib/hub-actor-client";
import type { ZipParsePayload } from "@/components/skills/skill-zip-dropzone";

type UploadJson = {
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

function applyParsed(json: UploadJson, onParsed: (p: ZipParsePayload) => void) {
  if (!json.data) return;
  const d = json.data;
  onParsed({
    files: d.files,
    hints: d.hints ?? {},
    body: d.body ?? "",
    issues: d.issues ?? [],
    objectStorage: d.objectStorage,
  });
}

/** Rule：单文件 .md（推荐）或 ZIP；POST /api/upload kind=rule */
export function RuleZipDropzone({
  onParsed,
}: {
  onParsed: (p: ZipParsePayload) => void;
}) {
  const mdId = useId();
  const zipId = useId();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const parseMarkdownFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".md")) {
        toast.error("请上传 .md 文件");
        return;
      }
      setBusy(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "rule");
      const headers = new Headers();
      const actor = getHubActorFromStorage();
      if (actor) headers.set("X-Hub-Actor", encodeHubActorForRequestHeader(actor));
      let json: UploadJson;
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd, headers });
        json = (await res.json()) as UploadJson;
        if (!res.ok || json.code !== 0 || !json.data) {
          toast.error(json.message || "解析失败");
          return;
        }
        applyParsed(json, onParsed);
        toast.success("Markdown 解析完成 🦞");
      } catch {
        toast.error("上传失败");
      } finally {
        setBusy(false);
      }
    },
    [onParsed],
  );

  const parseZipFile = useCallback(
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
      if (actor) xhr.setRequestHeader("X-Hub-Actor", encodeHubActorForRequestHeader(actor));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
        }
      };
      xhr.onload = () => {
        setBusy(false);
        setProgress(null);
        let json: UploadJson;
        try {
          json = JSON.parse(xhr.responseText) as UploadJson;
        } catch {
          toast.error("解析响应失败");
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300 || json.code !== 0 || !json.data) {
          toast.error(json.message || "解析失败");
          return;
        }
        applyParsed(json, onParsed);
        const os = json.data.objectStorage;
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

  const routeFile = useCallback(
    (file: File) => {
      const n = file.name.toLowerCase();
      if (n.endsWith(".md")) void parseMarkdownFile(file);
      else if (n.endsWith(".zip")) parseZipFile(file);
      else toast.error("请上传 .md 或 .zip");
    },
    [parseMarkdownFile, parseZipFile],
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
        if (f) routeFile(f);
      }}
    >
      <input
        id={mdId}
        type="file"
        accept=".md,text/markdown"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void parseMarkdownFile(f);
          e.target.value = "";
        }}
      />
      <input
        id={zipId}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) parseZipFile(f);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-4 border-dashed px-4 py-8 text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] transition",
          drag
            ? "border-[var(--rule-accent)] bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]"
            : "border-[var(--rule-border)] bg-[#fffef8] hover:border-[var(--rule-accent)]/60",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <span className="text-[var(--pixel-fg)]">
          {busy
            ? progress != null
              ? `上传中… ${progress}%`
              : "处理中…"
            : "拖拽 .md 或 ZIP 到此处，或点击下方选择"}
        </span>
        <span className="text-xs">
          推荐直接上传 Markdown（任意文件名）；ZIP 内需有 .md 主说明，多文件时请用 RULE.md 标明入口；单文件 ≤2MB，ZIP ≤10MB
        </span>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            className="border-2 border-[var(--rule-border)] bg-[var(--pixel-cyan)]/30 px-3 py-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-105"
            onClick={() => document.getElementById(mdId)?.click()}
          >
            选择 Markdown
          </button>
          <button
            type="button"
            disabled={busy}
            className="border-2 border-[var(--rule-border)] bg-[var(--pixel-yellow)]/40 px-3 py-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-105"
            onClick={() => document.getElementById(zipId)?.click()}
          >
            选择 ZIP
          </button>
        </div>
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
      </div>
    </div>
  );
}
