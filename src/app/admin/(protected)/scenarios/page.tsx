import { prisma } from "@/lib/prisma";
import { AdminScenariosClient } from "@/components/admin/AdminScenariosClient";

export const dynamic = "force-dynamic";

export default async function AdminScenariosPage() {
  const [items, roles, skills, rules, domains] = await Promise.all([
    prisma.scenarioPackage.findMany({
      include: {
        roles: { select: { roleId: true, isOptional: true }, orderBy: { sortOrder: "asc" } },
        skills: { select: { skillId: true }, orderBy: { sortOrder: "asc" } },
        rules: { select: { ruleId: true }, orderBy: { sortOrder: "asc" } },
        domainLinks: { select: { domainId: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.roleTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        skillLinks: { select: { skillId: true }, orderBy: { sortOrder: "asc" } },
        ruleLinks: { select: { ruleId: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { name: "asc" },
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
          场景方案
        </h1>
        <p className="font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
          维护场景方案、入口专家、专家链及安装资产组合。
        </p>
      </div>
      <AdminScenariosClient
        initialItems={items.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          longDescription: item.longDescription,
          publishStatus: item.publishStatus,
          supportedProfiles: Array.isArray(item.supportedProfiles) ? (item.supportedProfiles as string[]) : [],
          recommendedIdes: Array.isArray(item.recommendedIdes) ? (item.recommendedIdes as string[]) : [],
          tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
          entryRoleId: item.entryRoleId,
          isFeatured: item.isFeatured,
          roleItems: item.roles.map((link) => ({ id: link.roleId, isOptional: link.isOptional })),
          skillIds: item.skills.map((link) => link.skillId),
          ruleIds: item.rules.map((link) => link.ruleId),
          domainIds: item.domainLinks.map((link) => link.domainId),
          updatedAt: item.updatedAt.toISOString(),
        }))}
        roles={roles.map((role) => ({
          id: role.id,
          name: role.name,
          slug: role.slug,
          skillIds: role.skillLinks.map((link) => link.skillId),
          ruleIds: role.ruleLinks.map((link) => link.ruleId),
        }))}
        skills={skills}
        rules={rules}
        domains={domains}
      />
    </div>
  );
}
