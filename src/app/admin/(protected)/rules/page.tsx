import { prisma } from "@/lib/prisma";
import { MODERATION_STATUS } from "@/lib/moderation";
import { AdminResourceTable } from "@/components/admin/AdminResourceTable";

export const dynamic = "force-dynamic";

export default async function AdminPendingRulesPage() {
  const items = await prisma.rule.findMany({
    where: { moderationStatus: MODERATION_STATUS.PENDING },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-pixel-heading)] text-lg text-[var(--pixel-fg)]">
        待审核 Rule
      </h1>
      <AdminResourceTable type="rule" items={items} />
    </div>
  );
}
