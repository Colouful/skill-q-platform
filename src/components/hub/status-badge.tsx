import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<string, string> = {
  draft: "草稿",
  reviewing: "审核中",
  published: "已发布",
  deprecated: "已废弃",
  archived: "已归档",
  rejected: "已驳回",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "border-sky-200 bg-sky-50 text-sky-700",
  reviewing: "border-amber-200 bg-amber-50 text-amber-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  deprecated: "border-orange-200 bg-orange-50 text-orange-700",
  archived: "border-zinc-300 bg-zinc-100 text-zinc-600",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const value = status || "unknown";
  return (
    <Badge variant="outline" className={cn("rounded-md border px-2 py-0.5", STATUS_CLASS[value] ?? "bg-muted", className)}>
      {STATUS_TEXT[value] ?? value}
    </Badge>
  );
}
