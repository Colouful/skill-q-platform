import { cn } from "@/lib/utils";

export function ChecksumText({ value, className }: { value?: unknown; className?: string }) {
  const text = String(value ?? "");
  return (
    <code className={cn("inline-block max-w-[18rem] truncate rounded bg-muted px-2 py-1 font-mono text-xs", className)} title={text}>
      {text || "未生成"}
    </code>
  );
}
