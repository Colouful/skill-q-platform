import { prisma } from "@/lib/prisma";
import { AdminRolesClient } from "@/components/admin/AdminRolesClient";
import { stringArrayFromJson } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const sp = await searchParams;
  const [items, skills, rules, domains] = await Promise.all([
    prisma.roleTemplate.findMany({
      include: {
        skillLinks: { select: { skillId: true }, orderBy: { sortOrder: "asc" } },
        ruleLinks: { select: { ruleId: true }, orderBy: { sortOrder: "asc" } },
        domainLinks: { select: { domainId: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.skill.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.rule.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.capabilityDomain.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
          专家管理
        </h1>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          维护专家信息、关联 Skill / Rule 和能力域。
        </p>
      </div>
      <AdminRolesClient
        initialItems={items.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          registryId: item.registryId,
          manifestId: item.manifestId,
          author: item.author,
          description: item.description,
          longDescription: item.longDescription,
          publishStatus: item.publishStatus,
          roleStatus: item.roleStatus,
          supportedProfiles: stringArrayFromJson(item.supportedProfiles),
          tags: stringArrayFromJson(item.tags),
          triggers: stringArrayFromJson(item.triggers),
          preferredSkills: stringArrayFromJson(item.preferredSkills),
          reads: stringArrayFromJson(item.reads),
          writes: stringArrayFromJson(item.writes),
          handoffTo: stringArrayFromJson(item.handoffTo),
          rolePositioning: item.rolePositioning,
          workingPrinciples: stringArrayFromJson(item.workingPrinciples),
          requiredSteps: stringArrayFromJson(item.requiredSteps),
          executionContract: item.executionContract,
          outputStandard: item.outputStandard,
          prohibitedActions: stringArrayFromJson(item.prohibitedActions),
          handoffNotes: item.handoffNotes,
          skillIds: item.skillLinks.map((link) => link.skillId),
          ruleIds: item.ruleLinks.map((link) => link.ruleId),
          domainIds: item.domainLinks.map((link) => link.domainId),
          updatedAt: item.updatedAt.toISOString(),
        }))}
        initialEditSlug={sp.edit?.trim() || null}
        skills={skills}
        rules={rules}
        domains={domains}
      />
    </div>
  );
}
