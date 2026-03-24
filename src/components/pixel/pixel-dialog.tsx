"use client";

import type { ComponentProps } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const pixelPopup =
  "pixel-dialog-animate rounded-none border-4 border-[var(--pixel-border)] bg-[#fffef8] p-5 shadow-[8px_8px_0_0_var(--pixel-border)] sm:max-w-md";

/** 14.7 像素风弹层内容（配合 Dialog 根使用） */
export function PixelDialogContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return <DialogContent className={cn(pixelPopup, className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
