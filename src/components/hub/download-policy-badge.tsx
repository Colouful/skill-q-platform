import { normalizeDownloadPolicy } from "@/lib/download-policy";

/** 详情页展示下载策略 */
export function DownloadPolicyBadge({ policy }: { policy: string | null | undefined }) {
  const p = normalizeDownloadPolicy(policy);
  if (p === "public") {
    return (
      <span
        className="inline-flex items-center gap-1 border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]"
        title="任何人可下载"
      >
        🌍 公开下载
      </span>
    );
  }
  if (p === "login") {
    return (
      <span
        className="inline-flex items-center gap-1 border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]"
        title="需登录后下载"
      >
        🔒 需登录
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 border-2 border-[var(--pixel-border)] bg-[#fffef8] px-2 py-0.5 font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]"
      title="仅资源作者可下载"
    >
      👤 仅作者
    </span>
  );
}
