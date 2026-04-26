import { Button } from "@/components/ui/button";
import { AuditLogList } from "@/components/hub/audit-log-list";
import { PublishCheckPanel } from "@/components/hub/publish-check-panel";
import { ReviewStatusTimeline } from "@/components/hub/review-status-timeline";

type ReviewActionPanelProps = {
  status: string;
  rejectedReason?: string;
  publishChecks: Array<{ label: string; passed: boolean; detail?: string }>;
  onSubmitReview: (note?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onPublish: () => Promise<void>;
};

export function ReviewActionPanel({
  status,
  rejectedReason,
  publishChecks,
  onSubmitReview,
  onReject,
  onPublish,
}: ReviewActionPanelProps) {
  const canSubmit = status === "draft" || status === "rejected";
  const canReview = status === "reviewing";
  const allChecksPassed = publishChecks.every((item) => item.passed);

  async function submitReview() {
    const note = window.prompt("请输入提交审核说明，可留空") ?? undefined;
    if (!window.confirm("确认提交审核？")) return;
    await onSubmitReview(note);
  }

  async function rejectReview() {
    const reason = window.prompt("请输入驳回原因");
    if (!reason?.trim()) return;
    await onReject(reason.trim());
  }

  async function publish() {
    if (!allChecksPassed && !window.confirm("发布前检查仍有待处理项，确认继续尝试发布？")) return;
    if (!window.confirm("确认审核通过并发布？发布后不可直接修改正文或绑定关系。")) return;
    await onPublish();
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">审核状态流转</h2>
          <p className="mt-1 text-sm text-muted-foreground">draft {"->"} reviewing {"->"} published / rejected，published 后不可直接修改。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit ? <Button size="sm" onClick={() => void submitReview()}>提交审核</Button> : null}
          {canReview ? <Button size="sm" onClick={() => void publish()}>审核通过发布</Button> : null}
          {canReview ? <Button size="sm" variant="outline" onClick={() => void rejectReview()}>驳回</Button> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <ReviewStatusTimeline status={status} />
        {status === "published" ? <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-700">已发布，不可直接修改。</div> : null}
        {status === "rejected" ? <div className="rounded-md border bg-destructive/10 p-3 text-sm text-destructive">驳回原因：{rejectedReason || "未记录"}</div> : null}
        <PublishCheckPanel checks={publishChecks} />
        <AuditLogList />
      </div>
    </section>
  );
}
