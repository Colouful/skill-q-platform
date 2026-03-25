"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PixelButton, PixelInput, PixelTextarea } from "@/components/pixel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/client-api";
import { apiRulePath, rulePath } from "@/lib/slug-url";
import {
  type SkillFileEntry,
  languageFromPath,
  suggestNextPatchVersion,
} from "@/lib/skill-file-entries";
import type { RuleVersion } from "@/generated/prisma";
import { cn } from "@/lib/utils";

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

/** Monaco + 文件树 + 保存为新 Rule 版本 */
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
  const [activePath, setActivePath] = useState(() => initialFiles[0]?.path ?? "RULE.md");
  const [version, setVersion] = useState(() => suggestNextPatchVersion(latestVersionLabel));
  const [changelog, setChangelog] = useState("");
  const [saving, setSaving] = useState(false);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activePath),
    [files, activePath],
  );

  const editorValue = activeFile?.content ?? "";

  const updateContent = useCallback((path: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content } : f)),
    );
  }, []);

  function addFile() {
    const raw = window.prompt("新文件路径（相对根目录，如 rules/order.json）");
    if (!raw?.trim()) return;
    const path = raw.trim().replace(/^\/+/, "").replace(/\\/g, "/");
    if (files.some((f) => f.path === path)) {
      toast.error("该路径已存在");
      return;
    }
    const name = path.split("/").pop() || path;
    setFiles((prev) => [...prev, { name, path, content: "" }].sort((a, b) => a.path.localeCompare(b.path)));
    setActivePath(path);
  }

  function removeFile(path: string) {
    if (files.length <= 1) {
      toast.error("至少保留一个文件");
      return;
    }
    if (!window.confirm(`删除 ${path}？`)) return;
    setFiles((prev) => {
      const next = prev.filter((f) => f.path !== path);
      if (path === activePath) {
        setActivePath(next[0]?.path ?? "");
      }
      return next;
    });
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

      <div className="grid min-h-0 grid-cols-1 gap-3 lg:min-h-[min(72vh,620px)] lg:grid-cols-[minmax(0,220px)_1fr]">
        <aside className="flex max-h-36 flex-col border-4 border-[var(--rule-border)] bg-[#fffef8] lg:max-h-[min(72vh,620px)]">
          <div className="flex items-center justify-between border-b-2 border-[var(--rule-border)] px-2 py-2">
            <span className="font-[family-name:var(--font-pixel-heading)] text-xs text-[var(--pixel-fg)]">
              文件
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 border-2 border-[var(--rule-border)] text-xs"
              onClick={addFile}
            >
              +
            </Button>
          </div>
          <ul className="flex min-h-0 flex-1 flex-row gap-1 overflow-x-auto overflow-y-hidden p-2 font-[family-name:var(--font-pixel-body)] text-xs lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
            {files.map((f) => (
              <li
                key={f.path}
                className="flex min-w-0 max-w-[11rem] shrink-0 items-center gap-1 rounded border-2 border-transparent py-0.5 lg:max-w-none lg:w-full"
              >
                <button
                  type="button"
                  onClick={() => setActivePath(f.path)}
                  className={cn(
                    "min-w-0 flex-1 truncate rounded px-1 text-left hover:bg-[var(--pixel-cyan)]/25",
                    activePath === f.path &&
                      "bg-[var(--pixel-yellow)]/40 font-medium text-[var(--pixel-fg)]",
                  )}
                >
                  {f.path}
                </button>
                <button
                  type="button"
                  className="shrink-0 text-[var(--pixel-muted)] hover:text-[var(--rule-accent)]"
                  aria-label={`删除 ${f.path}`}
                  onClick={() => removeFile(f.path)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
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
            <Label htmlFor="rule-ws-changelog" className="font-[family-name:var(--font-pixel-body)]">
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
