import { PageLoadingLobster } from "@/components/layout/page-loading-lobster";

/** Skill 详情页过渡：仅龙虾，避免多块骨架与真实卡片错位 */
export function SkillDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <PageLoadingLobster minHeight="min-h-[50vh]" />
    </div>
  );
}
