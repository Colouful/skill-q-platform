"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PixelButton, PixelInput, PixelTextarea } from "@/components/pixel";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPathDialog } from "@/components/hub/add-path-dialog";
import { FilePathTreeView } from "@/components/hub/file-path-tree-view";
import { fetchApi } from "@/lib/client-api";
import { apiRulePath, rulePath } from "@/lib/slug-url";
import {
  type SkillFileEntry,
  languageFromPath,
  suggestNextPatchVersion,
} from "@/lib/skill-file-entries";
import {
  buildFilePathTree,
  collectParentFolderPrefixes,
  suggestDefaultParentPrefix,
} from "@/lib/path-file-tree";
import type { RuleVersion } from "@/generated/prisma";

const EDITOR_HEIGHT = "min(calc(100dvh - 14rem), 560px)";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center border-4 border-[var(--rule-border)] bg-[#fffef8] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]"
      style={{ height: EDITOR_HEIGHT }}
    >
      加载编辑器…
    </div>
  ),
});

function joinPath(parent: string, name: string): string {
  const p = parent.replace(/^\/+|\/+$/g, "");
  const n = name.replace(/^\/+|\/+$/g, "");
  return p ? `${p}/${n}` : n;
}

function pruneVirtualWhenFileAdded(virtual: string[], filePath: string): string[] {
  const norm = filePath.replace(/^\/+/, "");
  return virtual.filter((v) => norm !== v && !norm.startsWith(`${v}/`));
}

function folderPathTaken(fullFolder: string, files: SkillFileEntry[], virtual: string[]): boolean {
  if (virtual.includes(fullFolder)) return true;
  return files.some((f) => f.path === fullFolder || f.path.startsWith(`${fullFolder}/`));
}

/** Monaco + 树形文件 + 保存为新 Rule 版本 */
export function RuleWorkspace({
  slug,
  ruleName,
  initialFiles,
  latestVersionLabel,
}: {
  slug: string;
  ruleName: string;
  initialFiles: SkillFileEntry[];
  latestVersionLabel: string;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<SkillFileEntry[]>(initialFiles);
  const [virtualFolderPrefixes, setVirtualFolderPrefixes] = useState<string[]>([]);
  const [activePath, setActivePath] = useState(() => initialFiles[0]?.path ?? "RULE.md");
  const [version, setVersion] = useState(() => suggestNextPatchVersion(latestVersionLabel));
  const [changelog, setChangelog] = useState("");
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"file" | "folder">("file");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const treeNodes = useMemo(
    () => buildFilePathTree(files, virtualFolderPrefixes),
    [files, virtualFolderPrefixes],
  );

  const preferredParentForAddDialog = useMemo(
    () => suggestDefaultParentPrefix(files, virtualFolderPrefixes),
    [files, virtualFolderPrefixes],
  );

  const parentOptionsForDialog = useMemo(() => {
    const fromFiles = collectParentFolderPrefixes(files);
    const set = new Set<string>(["", ...fromFiles, ...virtualFolderPrefixes]);
    for (const v of virtualFolderPrefixes) {
      let acc = "";
      for (const seg of v.split("/").filter(Boolean)) {
        acc = acc ? `${acc}/${seg}` : seg;
        set.add(acc);
      }
    }
    return [...set].sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });
  }, [files, virtualFolderPrefixes]);

  const activeFile = useMemo(() => files.find((f) => f.path === activePath), [files, activePath]);

  const editorValue = activeFile?.content ?? "";

  const updateContent = useCallback((path: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, content } : f)));
  }, []);

  function openAdd(mode: "file" | "folder") {
    setAddMode(mode);
    setAddOpen(true);
  }

  function handleAddConfirm({ parentPrefix, name }: { parentPrefix: string; name: string }) {
    if (addMode === "folder") {
      const full = joinPath(parentPrefix, name);
      if (folderPathTaken(full, files, virtualFolderPrefixes)) {
        toast.error("该目录已存在或已有文件占用");
        return false;
      }
      setVirtualFolderPrefixes((prev) =>
        [...new Set([...prev, full])].sort((a, b) => a.localeCompare(b)),
      );
      toast.success(`已添加空目录 ${full}`);
      return;
    }

    const fullPath = joinPath(parentPrefix, name);
    if (files.some((f) => f.path === fullPath)) {
      toast.error("该路径已存在");
      return false;
    }
    const fileName = name.split("/").pop() || name;
    setFiles((prev) =>
      [...prev, { name: fileName, path: fullPath, content: "" }].sort((a, b) =>
        a.path.localeCompare(b.path),
      ),
    );
    setVirtualFolderPrefixes((prev) => pruneVirtualWhenFileAdded(prev, fullPath));
    setActivePath(fullPath);
    toast.success(`已创建 ${fullPath}`);
  }

  function removeVirtualFolder(prefix: string) {
    setVirtualFolderPrefixes((prev) => prev.filter((p) => p !== prefix));
    toast.message(`已移除空目录 ${prefix}`);
  }

  function confirmRemoveFile(path: string) {
    if (files.length <= 1) {
      toast.error("至少保留一个文件");
      return;
    }
    setDeleteTarget(path);
  }

  function executeRemoveFile() {
    const path = deleteTarget;
    if (!path) return;
    setDeleteTarget(null);
    setFiles((prev) => {
      const next = prev.filter((f) => f.path !== path);
      if (path === activePath) {
        setActivePath(next[0]?.path ?? "");
      }
      return next;
    });
    toast.message(`已删除 ${path}`);
  }

  async function saveVersion() {
    const ver = version.trim();
    if (!ver) {
      toast.error("请填写版本号");
      return;
    }
    setSaving(true);
    const res = await fetchApi<RuleVersion>(apiRulePath(slug, "/versions"), {
      method: "POST",
      body: JSON.stringify({
        version: ver,
        changelog: changelog.trim() || undefined,
        files: files.map((f) => ({
          name: f.name,
          path: f.path,
          content: f.content,
        })),
        isLatest: true,
      }),
    });
    setSaving(false);
    if (res.code === 0 && res.data) {
      toast.success("已保存新版本 🦞");
      setVirtualFolderPrefixes([]);
      router.push(rulePath(slug));
      router.refresh();
    } else {
      toast.error(res.message || "保存失败");
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 px-4 pb-8 sm:px-0 lg:px-5">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/rules" className="hover:text-[var(--pixel-fg)]">
          Rules
        </Link>
        <span className="mx-1">/</span>
        <Link href={rulePath(slug)} className="hover:text-[var(--pixel-fg)]">
          {ruleName}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">在线编辑</span>
      </nav>

      <header className="border-b-4 border-[var(--rule-border)] pb-4">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          在线编辑 · {ruleName}
        </h1>
        <p className="mt-1 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          基于最新版本文件；保存将创建新版本并写入 Rule 包
        </p>
      </header>

      <div className="grid min-h-0 grid-cols-1 gap-3 lg:min-h-[min(72vh,620px)] lg:grid-cols-[minmax(0,260px)_1fr]">
        <aside className="flex max-h-56 flex-col border-4 border-[var(--rule-border)] bg-[#fffef8] lg:max-h-[min(72vh,620px)]">
          <div className="flex items-center justify-between gap-1 border-b-2 border-[var(--rule-border)] px-2 py-2">
            <span className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
              文件
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className="inline-flex h-7 items-center rounded-md border-2 border-[var(--rule-border)] bg-[#fffef8] px-2 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-fg)] hover:bg-[var(--pixel-cyan)]/20"
              >
                新增
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-2 border-[var(--rule-border)] bg-[#fffef8]"
              >
                <DropdownMenuItem
                  className="font-[family-name:var(--font-pixel-body)] text-xs"
                  onClick={() => openAdd("file")}
                >
                  新建文件…
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="font-[family-name:var(--font-pixel-body)] text-xs"
                  onClick={() => openAdd("folder")}
                >
                  新建文件夹…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <FilePathTreeView
            nodes={treeNodes}
            selectedPath={activePath}
            onSelectFile={(path) => setActivePath(path)}
            onRemoveVirtualFolder={removeVirtualFolder}
            renderFileActions={(node) => (
              <button
                type="button"
                className="shrink-0 text-[var(--pixel-muted)] hover:text-[var(--rule-accent)]"
                aria-label={`删除 ${node.fullPath}`}
                onClick={(e) => {
                  e.stopPropagation();
                  confirmRemoveFile(node.fullPath);
                }}
              >
                ×
              </button>
            )}
            theme="rule"
            className="flex min-h-0 flex-1 flex-col"
          />
        </aside>

        <div
          className="flex min-h-0 min-w-0 flex-col border-4 border-[var(--rule-border)] bg-[#fffef8]"
          style={{ minHeight: EDITOR_HEIGHT }}
        >
          <MonacoEditor
            key={activePath}
            height={EDITOR_HEIGHT}
            theme="vs-light"
            path={activePath}
            language={languageFromPath(activePath)}
            value={editorValue}
            onChange={(v) => updateContent(activePath, v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      <AddPathDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode={addMode}
        parentOptions={parentOptionsForDialog}
        preferredParentPrefix={preferredParentForAddDialog}
        onConfirm={handleAddConfirm}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent
          className="max-w-sm border-4 border-[var(--rule-border)] bg-[#fffef8]"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]">
              删除文件
            </DialogTitle>
          </DialogHeader>
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            确定删除{" "}
            <span className="break-all font-mono text-[var(--pixel-fg)]">{deleteTarget}</span>？
          </p>
          <DialogFooter className="border-t-0">
            <PixelButton
              type="button"
              variant="outline"
              size="md"
              className="border-[var(--rule-border)] shadow-[3px_3px_0_0_var(--rule-shadow)]"
              onClick={() => setDeleteTarget(null)}
            >
              取消
            </PixelButton>
            <PixelButton type="button" variant="rule" size="md" onClick={executeRemoveFile}>
              删除
            </PixelButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3 border-t-4 border-[var(--rule-border)] pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rule-ws-ver" className="font-[family-name:var(--font-pixel-body)]">
              新版本号
            </Label>
            <PixelInput
              id="rule-ws-ver"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="如 1.0.1"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="rule-ws-changelog"
              className="font-[family-name:var(--font-pixel-body)]"
            >
              更新说明
            </Label>
            <PixelTextarea
              id="rule-ws-changelog"
              rows={3}
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="本次改动摘要"
            />
          </div>
        </div>
        <PixelButton
          type="button"
          size="lg"
          disabled={saving}
          onClick={() => void saveVersion()}
          className="w-full border-4 border-[var(--rule-border)] text-lg sm:w-auto"
        >
          {saving ? "保存中…" : "保存为新版本"}
        </PixelButton>
      </div>
    </div>
  );
}
