import { AdminAgentsClient } from "@/components/admin/AdminAgentsClient";

export const dynamic = "force-dynamic";

export default function AdminAgentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">用户管理</h1>
      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        Agent 账号列表：封禁、解封与 API Key 重置在详情页操作。
      </p>
      <AdminAgentsClient />
    </div>
  );
}
