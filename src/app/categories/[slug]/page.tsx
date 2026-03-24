import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SkillCard } from "@/components/skill/skill-card";
import { LobsterEmpty } from "@/components/lobster";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug_resourceType: { slug, resourceType: "skill" } },
    include: {
      skills: {
        include: { category: true },
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      },
    },
  });
  if (!category) notFound();

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-8 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/skills" className="hover:text-[var(--pixel-fg)]">
          Skills
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">{category.name}</span>
      </nav>

      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
            {category.description}
          </p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {category.skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>

      {category.skills.length === 0 && (
        <div className="py-8">
          <LobsterEmpty message="该分类下还没有 Skill，去上传一个吧！" />
        </div>
      )}
    </div>
  );
}
