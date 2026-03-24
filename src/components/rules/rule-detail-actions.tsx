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
import { LobsterCelebrate } from "@/components/lobster";

export function RuleDetailActions({
  slug,
  defaultForkName,
  defaultForkAuthor,
  canEdit,
}: {
  slug: string;
  defaultForkName: string;
  defaultForkAuthor: string;
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
    const res = await fetchApi<{ slug: string }>(`/api/rules/${slug}/fork`, {
      method: "POST",
      body: JSON.stringify({
        name: forkName.trim(),
        author: forkAuthor.trim(),
      }),
    });
    setForking(false);
    if (res.code === 0 && res.data?.slug) {
      toast.success("Fork 成功");
      setForkOpen(false);
      router.push(`/rules/${res.data.slug}/edit`);
    } else {
      toast.error(res.message || "Fork 失败");
    }
  }

  async function del() {
    setDeleting(true);
    const res = await fetchApi(`/api/rules/${slug}/delete`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setDeleting(false);
    if (res.code === 0) {
      setDeleteOpen(false);
      toast.success("已删除");
      router.push("/rules");
    } else {
      toast.error(res.message || "删除失败");
    }
  }

  return (
    <div className="flex flex-wrap gap-3 border-t-4 border-[var(--rule-border)] pt-6">
      {canEdit ? (
        <>
          <Link
            href={`/rules/${slug}/edit`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]",
            )}
          >
            元数据
          </Link>
          <Link
            href={`/rules/${slug}/editor`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-4 border-[var(--rule-border)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]",
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
        className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)] text-[var(--pixel-fg)]"
      >
        Fork
      </Button>

      <Dialog open={forkOpen} onOpenChange={setForkOpen}>
        <DialogContent className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-pixel-heading)]">
              Fork 此 Rule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="rule-fork-name" className="font-[family-name:var(--font-pixel-body)]">
                新名称
              </Label>
              <Input
                id="rule-fork-name"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-fork-author" className="font-[family-name:var(--font-pixel-body)]">
                作者
              </Label>
              <Input
                id="rule-fork-author"
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
              className="border-4 border-[var(--pixel-border)] bg-[var(--rule-accent)] font-[family-name:var(--font-pixel-body)] text-[#fffef8]"
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
              此操作会永久删除该 Rule 及其版本、评测，无法撤销。
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
              className="border-2 border-[var(--pixel-border)] bg-[var(--rule-accent)]"
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
