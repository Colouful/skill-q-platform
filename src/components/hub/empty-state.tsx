export function HubEmptyState({ title = "暂无数据", description = "调整筛选条件或创建新的治理资产。" }: { title?: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
