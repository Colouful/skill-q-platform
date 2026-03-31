import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RuleUploadForm } from "@/components/rules/rule-upload-form";

export const dynamic = "force-dynamic";

export default async function AdminRuleCreatePage() {
  const categories = await prisma.category.findMany({
    where: { resourceType: "rule" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--pixel-muted)]">
          <Link href="/admin/rules/manage" className="underline">
            Rule 管理
          </Link>
          <span>/</span>
          <span>新建 Rule</span>
        </div>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          后台新建会复用现有上传能力，状态仍遵循系统审核配置。
        </p>
      </div>
      <div className="pb-8">
        <RuleUploadForm
          categories={categories}
          adminMode
          successRedirectPath="/admin/rules/manage"
        />
      </div>
    </div>
  );
}
