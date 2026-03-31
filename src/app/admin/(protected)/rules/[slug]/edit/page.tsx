import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RuleEditForm } from "@/components/rules/rule-edit-form";

export const dynamic = "force-dynamic";

export default async function AdminRuleEditPage({
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
        <Link href="/admin/rules/manage" className="hover:text-[var(--pixel-fg)]">
          Rule 管理
        </Link>
        <span className="mx-1">/</span>
        <span className="text-[var(--pixel-fg)]">编辑 {rule.name}</span>
      </nav>
      <RuleEditForm
        rule={rule}
        categories={categories}
        expectedUpdatedAt={rule.updatedAt.toISOString()}
        successRedirectPath="/admin/rules/manage"
      />
    </div>
  );
}
