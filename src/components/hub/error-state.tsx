import { Button } from "@/components/ui/button";

export function HubErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p className="font-medium">加载失败</p>
      <p className="mt-1">{message || "请求失败，请稍后重试。"}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  );
}
