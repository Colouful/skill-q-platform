"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/client-api";
import { MODERATION_STATUS } from "@/lib/moderation";
import { apiSkillPath, skillPath } from "@/lib/slug-url";
import { LobsterCelebrate } from "@/components/lobster";

/** 4.8 删除 + Fork；11.1 Fork 表单 */
export function SkillDetailActions({
  slug,
  defaultForkName,
  defaultForkAuthor,
  canEdit,
}: {
  slug: string;
  defaultForkName: string;
  defaultForkAuthor: string;
  /** 仅作者（或旧数据且档案昵称与作者展示一致）可编辑/删除 */
  canEdit: boolean;
}) {
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const [forkOpen, setForkOpen] = useState(false);
  const [forkName, setForkName] = useState(defaultForkName);
  const [forkAuthor, setForkAuthor] = useState(defaultForkAuthor);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openForkDialog() {
    setForkName(defaultForkName);
    setForkAuthor(defaultForkAuthor);
    setForkOpen(true);
  }

  async function doFork() {
    setForking(true);
    const res = await fetchApi<{ slug: string; moderationStatus: string }>(
      apiSkillPath(slug, "/fork"),
      {
        method: "POST",
        body: JSON.stringify({
          name: forkName.trim(),
          author: forkAuthor.trim(),
        }),
      },
    );
    setForking(false);
    if (res.code === 0 && res.data?.slug) {
      setForkOpen(false);
      if (res.data.moderationStatus === MODERATION_STATUS.PENDING) {
        toast.success("Fork 成功，待审核通过后将公开展示 🦞");
        router.push("/skills");
      } else {
        toast.success("Fork 成功 🦞");
        router.push(skillPath(res.data.slug));
      }
    } else {
      toast.error(res.message || "Fork 失败");
    }
  }

  async function del() {
    setDeleting(true);
    const res = await fetchApi(apiSkillPath(slug, "/delete"), {
      method: "POST",
      body: JSON.stringify({}),
    });
    setDeleting(false);
    if (res.code === 0) {
      setDeleteOpen(false);
      toast.success("已删除");
      router.push("/skills");
    } else {
      toast.error(res.message || "删除失败");
    }
  }

  return (
    <div className="flex flex-wrap gap-3 border-t-4 border-[var(--pixel-border)] pt-6">
      {canEdit ? (
        <>
          <Link
            href={skillPath(slug, "/edit")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]",
            )}
          >
            编辑
          </Link>
          <Link
            href={skillPath(slug, "/editor")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]",
            )}
          >
            在线编辑
          </Link>
        </>
      ) : null}
      <Button
        type="button"
        disabled={forking}
        onClick={openForkDialog}
        className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
      >
        Fork
      </Button>

      <Dialog open={forkOpen} onOpenChange={setForkOpen}>
        <DialogContent className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-pixel-heading)]">
              Fork 此 Skill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="fork-name" className="font-[family-name:var(--font-pixel-body)]">
                新名称
              </Label>
              <Input
                id="fork-name"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fork-author" className="font-[family-name:var(--font-pixel-body)]">
                作者
              </Label>
              <Input
                id="fork-author"
                value={forkAuthor}
                onChange={(e) => setForkAuthor(e.target.value)}
                className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[var(--pixel-border)]"
              onClick={() => setForkOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={forking || !forkName.trim() || !forkAuthor.trim()}
              className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-accent)] font-[family-name:var(--font-pixel-body)]"
              onClick={() => void doFork()}
            >
              {forking ? "Fork 中…" : "确认 Fork"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canEdit ? (
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger
          type="button"
          className={cn(
            buttonVariants({ variant: "destructive" }),
            "border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]",
          )}
        >
          删除
        </AlertDialogTrigger>
        <AlertDialogContent className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-[family-name:var(--font-pixel-heading)]">
              <LobsterCelebrate className="h-8 w-8 shrink-0" />
              确定删除？
            </AlertDialogTitle>
            <AlertDialogDescription className="font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
              此操作会永久删除该 Skill 及其版本、评测，龙虾也拦不住撤回。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-[var(--pixel-border)]">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void del();
              }}
              className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-accent)]"
            >
              {deleting ? "删除中…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      ) : null}
    </div>
  );
}
