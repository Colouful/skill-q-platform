import Link from "next/link";
import type { Category, Skill } from "@/generated/prisma";
import { DiscoverSkillGrid } from "@/components/discover/discover-skill-grid";

type SkillRow = Skill & { category: Category };

export function DiscoverSkillList({
  title,
  subtitle,
  skills,
}: {
  title: string;
  subtitle: string;
  skills: SkillRow[];
}) {
  return (
    <>
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/" className="hover:text-[var(--pixel-fg)]">
          首页
        </Link>
        <span className="mx-1">/</span>
        <Link href="/skills" className="hover:text-[var(--pixel-fg)]">
          Skills
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">{title}</span>
      </nav>

      <header className="border-b-4 border-[var(--pixel-border)] pb-6">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          {title}
        </h1>
        <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          {subtitle}
        </p>
      </header>

      {skills.length === 0 ? (
        <p className="py-12 font-[family-name:var(--font-pixel-body)] text-[var(--pixel-muted)]">
          暂无数据
        </p>
      ) : (
        <DiscoverSkillGrid skills={skills} />
      )}
    </>
  );
}
