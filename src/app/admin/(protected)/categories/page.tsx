import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          分类管理
        </h1>
        <p className="mt-1 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          维护 Skill / Rule 分类；有资源的分类可先「迁移资源」或删除时选择迁移到其它分类。合并与迁移操作会写入审计日志。
        </p>
      </div>
      <AdminCategoriesClient />
    </div>
  );
}
