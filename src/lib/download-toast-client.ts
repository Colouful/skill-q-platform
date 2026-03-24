"use client";

import { toast } from "sonner";

/** 下载接口失败时的提示；若需登录则附带「加入特工局」入口 */
export function notifyDownloadApiError(message?: string) {
  const m = message?.trim() || "下载失败";
  if (m.includes("登录")) {
    toast.error(m, {
      action: {
        label: "加入特工局",
        onClick: () => {
          window.location.href = "/me?tab=register";
        },
      },
    });
    return;
  }
  toast.error(m);
}
