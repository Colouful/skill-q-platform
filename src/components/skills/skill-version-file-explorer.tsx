"use client";

import { useEffect, useMemo, useState } from "react";
import { buildFilePathTree } from "@/lib/path-file-tree";
import { FilePathTreeView } from "@/components/hub/file-path-tree-view";
import { languageFromPath } from "@/lib/skill-file-entries";

export type SkillVersionFileRow = { name: string; path: string; content?: string };

/** 版本详情页：树形文件列表 + 点击预览内容 */
export function SkillVersionFileExplorer({ files }: { files: SkillVersionFileRow[] }) {
  const nodes = useMemo(() => buildFilePathTree(files), [files]);
  const [selectedPath, setSelectedPath] = useState(() => files[0]?.path ?? "");

  useEffect(() => {
    if (files.length === 0) {
      setSelectedPath("");
      return;
    }
    if (!files.some((f) => f.path === selectedPath)) {
      setSelectedPath(files[0]!.path);
    }
  }, [files, selectedPath]);

  const selected = useMemo(
    () => files.find((f) => f.path === selectedPath),
    [files, selectedPath],
  );

  const lang = selected ? languageFromPath(selected.path) : "plaintext";

  return (
    <div className="mt-2 grid min-h-[min(60vh,520px)] gap-3 border-2 border-[var(--pixel-border)] bg-[#fffef8] p-3 sm:grid-cols-[minmax(0,240px)_1fr]">
      <div className="flex min-h-0 max-h-64 flex-col overflow-hidden border-2 border-[var(--pixel-border)] bg-[#fffef8] sm:max-h-none">
        <p className="border-b-2 border-[var(--pixel-border)] px-2 py-1.5 font-[family-name:var(--font-pixel-heading)] text-[10px] text-[var(--pixel-fg)]">
          文件
        </p>
        <FilePathTreeView
          nodes={nodes}
          selectedPath={selectedPath}
          onSelectFile={(path) => setSelectedPath(path)}
          theme="skill"
          className="flex-1"
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col border-2 border-[var(--pixel-border)] bg-[#fffef8]">
        <p className="border-b-2 border-[var(--pixel-border)] px-2 py-1.5 font-[family-name:var(--font-pixel-body)] text-[10px] text-[var(--pixel-muted)]">
          {selected ? (
            <>
              预览 <span className="font-mono text-[var(--pixel-fg)]">{selected.path}</span>
              <span className="ml-2 text-[var(--pixel-muted)]">({lang})</span>
            </>
          ) : (
            "选择左侧文件查看内容"
          )}
        </p>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {selected?.content !== undefined && selected.content !== "" ? (
            <pre
              className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[var(--pixel-fg)]"
            >
              {selected.content}
            </pre>
          ) : selected ? (
            <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
              该条目无正文或未存储内容。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
