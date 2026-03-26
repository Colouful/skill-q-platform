"use client";

import type { InputHTMLAttributes } from "react";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { encodeHubActorForRequestHeader, getHubActorFromStorage } from "@/lib/hub-actor-client";
import { tryCollectFilesFromDroppedFolder } from "@/lib/skill-folder-data-transfer";

export type ZipParsePayload = {
  files: { name: string; path: string; content: string }[];
  hints: { name?: string; description?: string };
  body: string;
  issues: string[];
  /** 可选 MinIO 归档结果 */
  objectStorage?: {
    stored: boolean;
    bucket?: string;
    objectKey?: string;
    reason?: "disabled" | "error";
    message?: string;
  };
};

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

async function fetchUpload(fd: FormData): Promise<{ ok: boolean; json: UploadJson }> {
  const headers = new Headers();
  const actor = getHubActorFromStorage();
  if (actor) headers.set("X-Hub-Actor", encodeHubActorForRequestHeader(actor));
  const res = await fetch("/api/upload", { method: "POST", body: fd, headers });
  const json = (await res.json()) as UploadJson;
  return { ok: res.ok, json };
}

function finishParse(
  ok: boolean,
  json: UploadJson,
  onParsed: (p: ZipParsePayload) => void,
  fromFolder: boolean,
) {
  if (!ok || json.code !== 0 || !json.data) {
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
  if (fromFolder) {
    if (os?.stored) toast.success("文件夹解析完成，已写入对象存储 🦞");
    else toast.success("文件夹导入完成 🦞");
  } else if (os?.stored) {
    toast.success("ZIP 解析完成，已写入对象存储 🦞");
  } else {
    toast.success("ZIP 解析完成 🦞");
    if (os?.reason === "error" && os.message) {
      toast.message(`对象存储备份失败：${os.message}`, { duration: 5000 });
    }
  }
}

/** Skill：ZIP 或本地文件夹（选择文件夹 / 拖拽目录） */
export function SkillZipDropzone({
  onParsed,
}: {
  onParsed: (p: ZipParsePayload) => void;
}) {
  const zipId = useId();
  const folderId = useId();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const parseZipFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("请上传 .zip 格式的 Skill 包");
        return;
      }
      setBusy(true);
      const fd = new FormData();
      fd.append("mode", "zip");
      fd.append("kind", "skill");
      fd.append("file", file);
      const { ok, json } = await fetchUpload(fd);
      setBusy(false);
      finishParse(ok, json, onParsed, false);
    },
    [onParsed],
  );

  const parseFolderFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        toast.error("文件夹为空");
        return;
      }
      setBusy(true);
      const fd = new FormData();
      fd.append("mode", "folder");
      fd.append("kind", "skill");
      for (const f of files) {
        fd.append("files", f);
      }
      const { ok, json } = await fetchUpload(fd);
      setBusy(false);
      finishParse(ok, json, onParsed, true);
    },
    [onParsed],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const dt = e.dataTransfer;
      try {
        const folderFiles = await tryCollectFilesFromDroppedFolder(dt);
        if (folderFiles) {
          void parseFolderFiles(folderFiles);
          return;
        }
      } catch {
        toast.error("读取拖拽文件夹失败，可改用「选择文件夹」或 ZIP");
        return;
      }
      const f = dt.files?.[0];
      if (f) void parseZipFile(f);
    },
    [parseFolderFiles, parseZipFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => void onDrop(e)}
    >
      <input
        id={zipId}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void parseZipFile(f);
          e.target.value = "";
        }}
      />
      <input
        id={folderId}
        type="file"
        className="sr-only"
        disabled={busy}
        multiple
        {...({ webkitdirectory: "" } as InputHTMLAttributes<HTMLInputElement>)}
        onChange={(e) => {
          const list = e.target.files;
          if (list?.length) void parseFolderFiles(Array.from(list));
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-4 border-dashed px-4 py-8 text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] transition",
          drag
            ? "border-[var(--pixel-accent)] bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]"
            : "border-[var(--pixel-border)] bg-[#fffef8]",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <span className="text-[var(--pixel-fg)]">
          {busy ? "处理中…" : "拖拽 ZIP 或文件夹到此处，或选择文件"}
        </span>
        <span className="text-xs">需包含 SKILL.md；ZIP 单包 ≤10MB，文件夹合计 ≤10MB</span>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/40 px-3 py-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-105"
            onClick={() => document.getElementById(zipId)?.click()}
          >
            选择 ZIP
          </button>
          <button
            type="button"
            disabled={busy}
            className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)]/30 px-3 py-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-105"
            onClick={() => document.getElementById(folderId)?.click()}
          >
            选择文件夹
          </button>
        </div>
        <span className="text-[10px] text-[var(--pixel-muted)]">选文件夹无需先压缩（Chrome / Edge / Safari 等支持）</span>
      </div>
    </div>
  );
}
