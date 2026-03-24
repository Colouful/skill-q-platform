import { LobsterLoading } from "@/components/lobster";
import { cn } from "@/lib/utils";

/** 列表/区块异步加载：仅龙虾动画，不出现骨架卡片，避免与 LobsterLoading 重复占位 */
export function PageLoadingLobster({
  className,
  minHeight = "min-h-[40vh]",
}: {
  className?: string;
  /** 主内容区垂直占位，减少加载前后跳动 */
  minHeight?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center py-12",
        minHeight,
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <LobsterLoading />
    </div>
  );
}
