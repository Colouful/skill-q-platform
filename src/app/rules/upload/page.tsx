import { prisma } from "@/lib/prisma";
import { RuleUploadForm } from "@/components/rules/rule-upload-form";

export const dynamic = "force-dynamic";

export default async function RuleUploadPage() {
  const categories = await prisma.category.findMany({
    where: { resourceType: "rule" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl pb-8">
      <RuleUploadForm categories={categories} />
    </div>
  );
}
