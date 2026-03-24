import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOptionalAuthAgentFromCookies } from "@/lib/agent-auth";
import { canEditSkillOrRule } from "@/lib/skill-rule-write-access";
import { RuleWorkspace } from "@/components/rules/editor/rule-workspace";
import { parseVersionFilesJson } from "@/lib/skill-file-entries";

export const dynamic = "force-dynamic";

export default async function RuleEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rule = await prisma.rule.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      author: true,
      authorAgentId: true,
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!rule) notFound();

  const viewer = await getOptionalAuthAgentFromCookies();
  if (!canEditSkillOrRule(viewer, rule.authorAgentId, rule.author)) {
    notFound();
  }

  const latest = rule.versions[0];
  const parsed = parseVersionFilesJson(latest?.files);
  const initialFiles =
    parsed.length > 0
      ? parsed
      : [{ name: "RULE.md", path: "RULE.md", content: "" }];

  return (
    <RuleWorkspace
      slug={rule.slug}
      ruleName={rule.name}
      initialFiles={initialFiles}
      latestVersionLabel={latest?.version ?? "0.0.0"}
    />
  );
}
