import { type Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export async function logCategoryAudit(
  adminId: string,
  action: string,
  categoryId: string | null,
  details: Prisma.InputJsonValue,
) {
  await prisma.categoryAuditLog.create({
    data: {
      adminId,
      action,
      categoryId,
      details,
    },
  });
}
