"use client";

import Link from "next/link";

/** 由父组件传入是否展示（与 useUploadLoginGate 搭配，避免重复请求） */
export function UploadLoginGateBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="mb-4 border-2 border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/25 px-3 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)]">
      当前站点要求 <strong>登录</strong> 后才能上传或发版。请
      <Link className="mx-1 underline" href="/login">
        登录
      </Link>
      或
      <Link className="mx-1 underline" href="/register">
        注册
      </Link>
      。
    </div>
  );
}
