import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SkillVersionPublishForm } from "@/components/skills/skill-version-publish-form";

export const dynamic = "force-dynamic";

export default async function SkillVersionNewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!skill) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/skills" className="hover:text-[var(--pixel-fg)]">
          Skills
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/skills/${skill.slug}`} className="hover:text-[var(--pixel-fg)]">
          {skill.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">新版本</span>
      </nav>
      <SkillVersionPublishForm slug={skill.slug} />
    </div>
  );
}
