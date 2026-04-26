type PublishCheck = {
  label: string;
  passed: boolean;
  detail?: string;
};

export function PublishCheckPanel({ checks }: { checks: PublishCheck[] }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-sm font-medium text-foreground">发布前检查结果</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className={check.passed ? "rounded-md border bg-emerald-50 p-2 text-sm text-emerald-700" : "rounded-md border bg-amber-50 p-2 text-sm text-amber-700"}
          >
            <span className="font-medium">{check.passed ? "通过" : "待处理"}</span>
            <span className="ml-2">{check.label}</span>
            {check.detail ? <p className="mt-1 text-xs">{check.detail}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
