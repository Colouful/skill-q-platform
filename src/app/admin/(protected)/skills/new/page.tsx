import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SkillUploadForm } from "@/components/skills/skill-upload-form";

export const dynamic = "force-dynamic";

export default async function AdminSkillCreatePage() {
  const categories = await prisma.category.findMany({
    where: { resourceType: "skill" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--pixel-muted)]">
          <Link href="/admin/skills/manage" className="underline">
            Skill 管理
          </Link>
          <span>/</span>
          <span>新建 Skill</span>
        </div>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          后台新建会复用现有上传能力，状态仍遵循系统审核配置。
        </p>
      </div>
      <div className="pb-8">
        <SkillUploadForm
          categories={categories}
          adminMode
          successRedirectPath="/admin/skills/manage"
        />
      </div>
    </div>
  );
}
