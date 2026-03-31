import { prisma } from "@/lib/prisma";
import { AdminResourceManagementClient } from "@/components/admin/AdminResourceManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminSkillManagementPage() {
  const categories = await prisma.category.findMany({
    where: { resourceType: "skill" },
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <AdminResourceManagementClient
      resourceType="skill"
      categories={categories}
      createHref="/admin/skills/new"
    />
  );
}
