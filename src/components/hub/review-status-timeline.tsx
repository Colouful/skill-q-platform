const REVIEW_STEPS = [
  { key: "draft", label: "草稿" },
  { key: "reviewing", label: "审核中" },
  { key: "published", label: "已发布" },
  { key: "deprecated", label: "已废弃" },
  { key: "archived", label: "已归档" },
] as const;

export function ReviewStatusTimeline({ status }: { status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REVIEW_STEPS.map((step) => (
        <div
          key={step.key}
          className={step.key === status ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground" : "rounded-full border px-3 py-1 text-xs text-muted-foreground"}
        >
          {step.label}
        </div>
      ))}
      {status === "rejected" ? <div className="rounded-full bg-destructive px-3 py-1 text-xs text-destructive-foreground">已驳回</div> : null}
    </div>
  );
}
