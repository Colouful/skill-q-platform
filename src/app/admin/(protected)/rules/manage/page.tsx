import { prisma } from "@/lib/prisma";
import { AdminResourceManagementClient } from "@/components/admin/AdminResourceManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminRuleManagementPage() {
  const categories = await prisma.category.findMany({
    where: { resourceType: "rule" },
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <AdminResourceManagementClient
      resourceType="rule"
      categories={categories}
      createHref="/admin/rules/new"
    />
  );
}
