"use client";

import { useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { encodeHubActorForRequestHeader, getHubActorFromStorage } from "@/lib/hub-actor-client";

export type RoleImportPayload = {
  files: { name: string; path: string; content: string }[];
  hints: { name?: string; description?: string; slug?: string; roleStatus?: string };
  body: string;
  meta: Record<string, unknown>;
  sections: {
    rolePositioning: string | null;
    workingPrinciples: string[];
    requiredSteps: string[];
    executionContract: string | null;
    outputStandard: string | null;
    prohibitedActions: string[];
    handoffNotes: string | null;
  };
  roleData: {
    slug: string;
    name: string;
    roleStatus: string;
    description: string;
    domains: string[];
    triggers: string[];
    preferredSkills: string[];
    reads: string[];
    writes: string[];
    handoffTo: string[];
  };
  mappedDomainIds: string[];
  unmatchedDomains: string[];
  ignoredMetaKeys: string[];
  issues: string[];
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
  data?: RoleImportPayload;
};

async function fetchUpload(fd: FormData): Promise<{ ok: boolean; json: UploadJson }> {
  const headers = new Headers();
  const actor = getHubActorFromStorage();
  if (actor) headers.set("X-Hub-Actor", encodeHubActorForRequestHeader(actor));
  const res = await fetch("/api/upload", { method: "POST", body: fd, headers });
  const json = (await res.json()) as UploadJson;
  return { ok: res.ok, json };
}

export function RoleImportDropzone({
  onParsed,
}: {
  onParsed: (payload: RoleImportPayload) => void;
}) {
  const fileId = useId();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const parseFile = useCallback(
    async (file: File) => {
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(".md") && !lowerName.endsWith(".zip")) {
        toast.error("请上传 .md 或 .zip 格式的专家文件");
        return;
      }

      setBusy(true);
      const fd = new FormData();
      fd.append("kind", "role");
      fd.append("mode", lowerName.endsWith(".zip") ? "zip" : "markdown");
      fd.append("file", file);
      const { ok, json } = await fetchUpload(fd);
      setBusy(false);

      if (!ok || json.code !== 0 || !json.data) {
        toast.error(json.message || "解析失败");
        return;
      }

      onParsed(json.data);
      if (json.data.objectStorage?.stored) toast.success("专家文件解析完成，已写入对象存储 🦞");
      else toast.success("专家文件解析完成 🦞");
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
        id={fileId}
        type="file"
        accept=".md,.zip,application/zip,text/markdown,text/plain"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void parseFile(f);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-4 border-dashed px-4 py-6 text-center font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)] transition",
          drag
            ? "border-[var(--pixel-accent)] bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]"
            : "border-[var(--pixel-border)] bg-[#fffef8]",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <span className="text-[var(--pixel-fg)]">
          {busy ? "处理中…" : "拖拽专家 Markdown / ZIP 到此处，或选择文件"}
        </span>
        <span className="text-xs">支持单个 .md 或 .zip，不支持文件夹</span>
        <button
          type="button"
          disabled={busy}
          className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/40 px-3 py-1.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:brightness-105"
          onClick={() => document.getElementById(fileId)?.click()}
        >
          选择 Markdown / ZIP
        </button>
      </div>
    </div>
  );
}
