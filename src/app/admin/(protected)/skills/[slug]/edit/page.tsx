import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SkillEditForm } from "@/components/skills/skill-edit-form";

export const dynamic = "force-dynamic";

export default async function AdminSkillEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [skill, categories] = await Promise.all([
    prisma.skill.findUnique({
      where: { slug },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { resourceType: "skill" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!skill) notFound();

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/admin/skills/manage" className="hover:text-[var(--pixel-fg)]">
          Skill 管理
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">编辑 {skill.name}</span>
      </nav>
      <SkillEditForm
        skill={skill}
        categories={categories}
        expectedUpdatedAt={skill.updatedAt.toISOString()}
        successRedirectPath="/admin/skills/manage"
      />
    </div>
  );
}
