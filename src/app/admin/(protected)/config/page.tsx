import { AdminConfigClient } from "@/components/admin/AdminConfigClient";

export const dynamic = "force-dynamic";

export default function AdminConfigPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">系统配置</h1>
      <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        配置写入数据库；未写入的项使用内置默认值。维护模式开启后访客将访问维护页。
      </p>
      <AdminConfigClient />
    </div>
  );
}
