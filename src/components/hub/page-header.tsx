import Link from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";

export function HubPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Link href="/hub" className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline">
          Hub 资产治理
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function HubNav({ className }: { className?: string }) {
  const items = [
    ["/hub/assets", "资产管理"],
    ["/hub/manifests", "Manifest 管理"],
    ["/hub/agent-profiles", "Agent Profile"],
    ["/hub/install-records", "安装记录"],
    ["/hub/runtime-feedback", "运行反馈"],
  ];
  return (
    <nav className={cn("flex flex-wrap gap-2", className)} aria-label="Hub 导航">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
          {label}
        </Link>
      ))}
    </nav>
  );
}
