import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { canEditSkillOrRule } from "@/lib/skill-rule-write-access";
import { SkillWorkspace } from "@/components/skills/editor/skill-workspace";
import { parseVersionFilesJson } from "@/lib/skill-file-entries";

export const dynamic = "force-dynamic";

export default async function SkillEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await prisma.skill.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      author: true,
      authorAgentId: true,
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!skill) notFound();

  const viewer = await getOptionalAuthAgentFromCookies();
  if (!canEditSkillOrRule(viewer, skill.authorAgentId, skill.author)) {
    notFound();
  }

  const latest = skill.versions[0];
  const parsed = parseVersionFilesJson(latest?.files);
  const initialFiles =
    parsed.length > 0
      ? parsed
      : [{ name: "SKILL.md", path: "SKILL.md", content: "" }];

  return (
    <SkillWorkspace
      slug={skill.slug}
      skillName={skill.name}
      initialFiles={initialFiles}
      latestVersionLabel={latest?.version ?? "0.0.0"}
    />
  );
}
