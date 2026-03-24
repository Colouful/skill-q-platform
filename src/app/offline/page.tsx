import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "离线",
  robots: { index: false, follow: false },
};

/** 预留给 Service Worker 离线回退；正常在线也可直接访问。 */
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 border-4 border-[var(--pixel-border)] bg-[#fffef8] px-6 py-10 text-center">
      <p className="font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
        你好像断网了
      </p>
      <p className="font-[family-name:var(--font-pixel-body)] text-base leading-relaxed text-[var(--pixel-muted)]">
        虾球Hub 需要网络才能浏览 Skill / Rule 与下载资源。请检查 Wi‑Fi 或移动数据后重试。
      </p>
      <Link
        href="/"
        className="border-2 border-[var(--pixel-border)] bg-[var(--pixel-cyan)] px-4 py-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-fg)] hover:brightness-95"
      >
        返回首页
      </Link>
    </div>
  );
}
