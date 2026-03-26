"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PixelButton, PixelInput } from "@/components/pixel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function normalizeName(raw: string): string {
  return raw.trim().replace(/\\/g, "/");
}

function validateSegment(name: string): string | null {
  const n = name.trim();
  if (!n) return "名称不能为空";
  if (n.includes("/") || n.includes("\\")) return "名称中不能含路径分隔符";
  if (n === "." || n === "..") return "不能使用 . 或 .. 作为名称";
  return null;
}

export type AddPathDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "file" | "folder";
  /** 不含首尾斜杠；含 "" 表示根目录 */
  parentOptions: string[];
  /**
   * 打开对话框时优先选中的父目录（须在 parentOptions 内）。
   * 例如包内路径均为 A/... 时传 "A"，避免新建项误落在包根与 A 平级。
   */
  preferredParentPrefix?: string;
  /** 返回 false 表示校验未通过，对话框保持打开 */
  onConfirm: (opts: { parentPrefix: string; name: string }) => void | boolean;
};

export function AddPathDialog({
  open,
  onOpenChange,
  mode,
  parentOptions,
  preferredParentPrefix,
  onConfirm,
}: AddPathDialogProps) {
  const sortedParents = useMemo(() => {
    const u = new Set(parentOptions);
    if (!u.has("")) u.add("");
    return [...u].sort((a, b) => {
      if (a === "") return -1;
      if (b === "") return 1;
      return a.localeCompare(b);
    });
  }, [parentOptions]);

  const [parentPrefix, setParentPrefix] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    const preferred =
      preferredParentPrefix && sortedParents.includes(preferredParentPrefix)
        ? preferredParentPrefix
        : (sortedParents[0] ?? "");
    setParentPrefix(preferred);
    setName("");
  }, [open, mode, sortedParents, preferredParentPrefix]);

  function submit() {
    const err = validateSegment(name);
    if (err) {
      toast.error(err);
      return;
    }
    const seg = normalizeName(name);
    if (!seg) {
      toast.error("名称不能为空");
      return;
    }
    const ok = onConfirm({ parentPrefix, name: seg });
    if (ok !== false) onOpenChange(false);
  }

  const title = mode === "file" ? "新建文件" : "新建文件夹";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-4 border-[var(--pixel-border)] bg-[#fffef8] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <Label className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]">
                父目录
              </Label>
              <p className="text-[10px] leading-snug text-[var(--pixel-muted)]">
                「（根目录）」是整个包的根，与您本机选中的外层文件夹名不一定相同；若当前文件都在同一顶层目录下，会默认选中该目录以便新建内容落在其内。
              </p>
            </div>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded border-2 border-[var(--pixel-border)] bg-[#fffef8] p-1.5">
              {sortedParents.map((p) => {
                const label = p === "" ? "（根目录）" : p;
                const sel = parentPrefix === p;
                return (
                  <button
                    key={p || "__root__"}
                    type="button"
                    onClick={() => setParentPrefix(p)}
                    className={cn(
                      "w-full truncate rounded px-2 py-1.5 text-left font-[family-name:var(--font-pixel-body)] text-xs",
                      sel
                        ? "bg-[var(--pixel-yellow)]/50 text-[var(--pixel-fg)]"
                        : "text-[var(--pixel-muted)] hover:bg-[var(--pixel-cyan)]/20",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-path-name" className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]">
              {mode === "file" ? "文件名" : "文件夹名"}
            </Label>
            <PixelInput
              id="add-path-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === "file" ? "如 helper.ts 或 SKILL.md" : "如 scripts"}
              className="bg-[#fffef8]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <p className="text-[10px] text-[var(--pixel-muted)]">
              {mode === "file"
                ? "将保存为："
                : "将创建路径："}
              <span className="font-mono text-[var(--pixel-fg)]">
                {parentPrefix ? `${parentPrefix}/` : ""}
                {name.trim() || "…"}
              </span>
            </p>
          </div>
        </div>
        <DialogFooter className="border-t-0 sm:justify-end">
          <PixelButton type="button" variant="outline" size="md" onClick={() => onOpenChange(false)}>
            取消
          </PixelButton>
          <PixelButton type="button" variant="primary" size="md" onClick={submit}>
            确定
          </PixelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
