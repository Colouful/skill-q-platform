"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHubActorFromStorage, setHubActorToStorage } from "@/lib/hub-actor-client";
import { cn } from "@/lib/utils";

/** 设置站点身份，随请求发送 X-Hub-Actor（开启 HUB_AUTH 时用于 Rule 等写操作） */
export function HubActorControl({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(getHubActorFromStorage());
  }, [open]);

  function save() {
    setHubActorToStorage(value);
    setDisplay(getHubActorFromStorage());
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "inline-flex h-8 max-w-[9rem] shrink-0 border-2 border-[var(--pixel-border)] px-1.5 font-[family-name:var(--font-pixel-body)] text-[10px] sm:max-w-[10rem] sm:text-xs",
          className,
        )}
        onClick={() => {
          setValue(getHubActorFromStorage());
          setOpen(true);
        }}
        title="站点身份（与资源作者一致，用于写操作校验）"
      >
        <UserRound className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{display ? display : "身份"}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-bg)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-pixel-heading)]">站点身份</DialogTitle>
          </DialogHeader>
          <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
            与上传/编辑时填写的「作者」保持一致。生产环境开启{" "}
            <code className="text-[var(--pixel-fg)]">HUB_AUTH</code> 后，写接口会校验{" "}
            <code className="text-[var(--pixel-fg)]">X-Hub-Actor</code>。
          </p>
          <div className="space-y-2 py-2">
            <Label htmlFor="hub-actor-input" className="font-[family-name:var(--font-pixel-body)]">
              当前身份（作者名）
            </Label>
            <Input
              id="hub-actor-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="例如与你的 Rule 作者相同"
              className="border-4 border-[var(--pixel-border)] font-[family-name:var(--font-pixel-body)]"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-2 border-[var(--pixel-border)]"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              className="border-4 border-[var(--pixel-border)] bg-[var(--pixel-yellow)] font-[family-name:var(--font-pixel-body)]"
              onClick={save}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
