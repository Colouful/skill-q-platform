import { prisma } from "@/lib/prisma";

export type ResourceTypeFilter = "skill" | "rule";

export async function countCategoryResources(categoryId: string, resourceType: ResourceTypeFilter) {
  if (resourceType === "skill") {
    return prisma.skill.count({ where: { categoryId } });
  }
  return prisma.rule.count({ where: { categoryId } });
}

export async function assertCategoryResourceType(
  id: string,
  expected: ResourceTypeFilter,
) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return { ok: false as const, error: "分类不存在" };
  if (cat.resourceType !== expected) {
    return { ok: false as const, error: "资源类型与分类不一致" };
  }
  return { ok: true as const, category: cat };
}
