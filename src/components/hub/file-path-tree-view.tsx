"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { FilePathTreeNode } from "@/lib/path-file-tree";

function collectFolderPrefixes<T>(nodes: FilePathTreeNode<T>[]): string[] {
  const out: string[] = [];
  const walk = (ns: FilePathTreeNode<T>[]) => {
    for (const n of ns) {
      if (n.kind === "folder") {
        out.push(n.prefix);
        walk(n.children);
      }
    }
  };
  walk(nodes);
  return out;
}

export type FilePathTreeViewProps<T extends { path: string }> = {
  nodes: FilePathTreeNode<T>[];
  selectedPath?: string | null;
  onSelectFile?: (path: string, data: T) => void;
  renderFileActions?: (node: Extract<FilePathTreeNode<T>, { kind: "file" }>) => React.ReactNode;
  onRemoveVirtualFolder?: (prefix: string) => void;
  /** 初次及路径集合变化时是否自动展开所有目录 */
  defaultExpandAll?: boolean;
  className?: string;
  theme?: "skill" | "rule";
};

export function FilePathTreeView<T extends { path: string }>({
  nodes,
  selectedPath,
  onSelectFile,
  renderFileActions,
  onRemoveVirtualFolder,
  defaultExpandAll = true,
  className,
  theme = "skill",
}: FilePathTreeViewProps<T>) {
  const folderPrefixes = useMemo(() => collectFolderPrefixes(nodes), [nodes]);
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    defaultExpandAll ? new Set(folderPrefixes) : new Set(),
  );

  useEffect(() => {
    if (!defaultExpandAll) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const p of folderPrefixes) next.add(p);
      return next;
    });
  }, [folderPrefixes, defaultExpandAll]);

  const toggle = useCallback((prefix: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(prefix)) next.delete(prefix);
      else next.add(prefix);
      return next;
    });
  }, []);

  const hoverDir =
    theme === "rule"
      ? "hover:bg-[var(--pixel-cyan)]/20"
      : "hover:bg-[var(--pixel-cyan)]/25";
  const activeFile =
    theme === "rule"
      ? "bg-[var(--pixel-yellow)]/40 font-medium text-[var(--pixel-fg)]"
      : "bg-[var(--pixel-yellow)]/40 font-medium text-[var(--pixel-fg)]";

  const renderNodes = (list: FilePathTreeNode<T>[], depth: number) => {
    return list.map((node) => {
      if (node.kind === "file") {
        const sel = selectedPath === node.fullPath;
        return (
          <div
            key={`f:${node.fullPath}`}
            className="flex min-w-0 items-center gap-0.5"
            style={{ paddingLeft: depth * 14 }}
          >
            <button
              type="button"
              onClick={() => onSelectFile?.(node.fullPath, node.data)}
              className={cn(
                "min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left font-[family-name:var(--font-pixel-body)] text-xs",
                hoverDir,
                sel && activeFile,
              )}
            >
              {node.name}
            </button>
            {renderFileActions?.(node)}
          </div>
        );
      }

      const isOpen = expanded.has(node.prefix);
      return (
        <div key={`d:${node.prefix}`} className="min-w-0">
          <div
            className="flex min-w-0 items-center gap-0.5"
            style={{ paddingLeft: depth * 14 }}
          >
            <button
              type="button"
              className={cn(
                "flex w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] text-[var(--pixel-muted)]",
                hoverDir,
              )}
              aria-expanded={isOpen}
              onClick={() => toggle(node.prefix)}
            >
              {isOpen ? "▼" : "▶"}
            </button>
            <button
              type="button"
              onClick={() => toggle(node.prefix)}
              className={cn(
                "min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)]",
                hoverDir,
              )}
            >
              {node.name}/
            </button>
            {node.isVirtual && onRemoveVirtualFolder ? (
              <button
                type="button"
                className="shrink-0 px-1 text-[var(--pixel-muted)] hover:text-[var(--pixel-accent)]"
                aria-label={`移除空目录 ${node.prefix}`}
                onClick={() => onRemoveVirtualFolder(node.prefix)}
              >
                ×
              </button>
            ) : null}
          </div>
          {isOpen ? renderNodes(node.children, depth + 1) : null}
        </div>
      );
    });
  };

  return (
    <div
      className={cn(
        "min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-2 font-[family-name:var(--font-pixel-body)]",
        className,
      )}
    >
      {nodes.length === 0 ? (
        <p className="text-xs text-[var(--pixel-muted)]">暂无文件</p>
      ) : (
        renderNodes(nodes, 0)
      )}
    </div>
  );
}
