import { prisma } from "@/lib/prisma";

type ResourceType = "skill" | "rule" | "role";

type DuplicateCheckInput = {
  resourceType: ResourceType;
  registryId?: string | null;
  manifestId?: string | null;
  excludeId?: string | null;
};

export async function assertUniqueRegistryFields(input: DuplicateCheckInput) {
  const issues: string[] = [];

  if (input.resourceType === "skill") {
    if (input.registryId) {
      const record = await prisma.skill.findFirst({
        where: {
          registryId: input.registryId,
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        select: { id: true, slug: true },
      });
      if (record) {
        issues.push(`registryId 已存在，对应 Skill：${record.slug}`);
      }
    }
    if (input.manifestId) {
      const record = await prisma.skill.findFirst({
        where: {
          manifestId: input.manifestId,
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        select: { id: true, slug: true },
      });
      if (record) {
        issues.push(`manifestId 已存在，对应 Skill：${record.slug}`);
      }
    }
  } else if (input.resourceType === "rule") {
    if (input.registryId) {
      const record = await prisma.rule.findFirst({
        where: {
          registryId: input.registryId,
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        select: { id: true, slug: true },
      });
      if (record) {
        issues.push(`registryId 已存在，对应 Rule：${record.slug}`);
      }
    }
    if (input.manifestId) {
      const record = await prisma.rule.findFirst({
        where: {
          manifestId: input.manifestId,
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        select: { id: true, slug: true },
      });
      if (record) {
        issues.push(`manifestId 已存在，对应 Rule：${record.slug}`);
      }
    }
  } else {
    if (input.registryId) {
      const record = await prisma.roleTemplate.findFirst({
        where: {
          registryId: input.registryId,
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        select: { id: true, slug: true },
      });
      if (record) {
        issues.push(`registryId 已存在，对应 Role：${record.slug}`);
      }
    }
    if (input.manifestId) {
      const record = await prisma.roleTemplate.findFirst({
        where: {
          manifestId: input.manifestId,
          ...(input.excludeId ? { NOT: { id: input.excludeId } } : {}),
        },
        select: { id: true, slug: true },
      });
      if (record) {
        issues.push(`manifestId 已存在，对应 Role：${record.slug}`);
      }
    }
  }

  return issues;
}
