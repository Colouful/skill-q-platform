import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { canEditSkillOrRule } from "@/lib/skill-rule-write-access";
import { SkillEditForm } from "@/components/skills/skill-edit-form";

export const dynamic = "force-dynamic";

export default async function SkillEditPage({
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

  const viewer = await getOptionalAuthAgentFromCookies();
  if (!canEditSkillOrRule(viewer, skill.authorAgentId, skill.author)) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl pb-8">
      <SkillEditForm
        skill={skill}
        categories={categories}
        expectedUpdatedAt={skill.updatedAt.toISOString()}
      />
    </div>
  );
}
