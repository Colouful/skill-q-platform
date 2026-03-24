"use client";

import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getHubActorFromStorage } from "@/lib/hub-actor-client";

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

/** 13.2 拖拽 / 点击上传 ZIP，调用 /api/upload */
export function SkillZipDropzone({
  onParsed,
}: {
  onParsed: (p: ZipParsePayload) => void;
}) {
  const id = useId();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const parseFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("请上传 .zip 格式的 Skill 包");
        return;
      }
      setBusy(true);
      const fd = new FormData();
      fd.append("file", file);
      const headers = new Headers();
      const actor = getHubActorFromStorage();
      if (actor) headers.set("X-Hub-Actor", actor);
      const res = await fetch("/api/upload", { method: "POST", body: fd, headers });
      const json = (await res.json()) as {
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
      setBusy(false);
      if (!res.ok || json.code !== 0 || !json.data) {
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
        if (f) void parseFile(f);
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
          if (f) void parseFile(f);
        }}
      />
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 border-4 border-dashed px-4 py-8 text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] transition",
          drag
            ? "border-[var(--pixel-accent)] bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]"
            : "border-[var(--pixel-border)] bg-[#fffef8] hover:border-[var(--pixel-accent)]/60",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <span className="text-[var(--pixel-fg)]">
          {busy ? "解析中…" : "拖拽 ZIP 到此处，或点击选择"}
        </span>
        <span className="text-xs">需包含 SKILL.md；单包 ≤10MB</span>
      </label>
    </div>
  );
}
