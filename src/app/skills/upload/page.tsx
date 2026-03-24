import { prisma } from "@/lib/prisma";
import { SkillUploadForm } from "@/components/skills/skill-upload-form";

export const dynamic = "force-dynamic";

export default async function SkillUploadPage() {
  const categories = await prisma.category.findMany({
    where: { resourceType: "skill" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-screen-2xl pb-8">
      <SkillUploadForm categories={categories} />
    </div>
  );
}
