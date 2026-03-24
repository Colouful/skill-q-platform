import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RuleEditForm } from "@/components/rules/rule-edit-form";

export const dynamic = "force-dynamic";

export default async function RuleEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [rule, categories] = await Promise.all([
    prisma.rule.findUnique({
      where: { slug },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { resourceType: "rule" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!rule) notFound();

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 pb-8">
      <nav className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        <Link href="/rules" className="hover:text-[var(--pixel-fg)]">
          Rules
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/rules/${rule.slug}`} className="hover:text-[var(--pixel-fg)]">
          {rule.name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">编辑</span>
      </nav>
      <RuleEditForm
        rule={rule}
        categories={categories}
        expectedUpdatedAt={rule.updatedAt.toISOString()}
      />
    </div>
  );
}
