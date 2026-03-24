import Link from "next/link";
import { cn } from "@/lib/utils";

function chip(active: boolean, ruleTone?: boolean): string {
  return cn(
    "border-2 px-2 py-1 font-[family-name:var(--font-pixel-body)] text-xs transition",
    active
      ? ruleTone
        ? "border-[var(--rule-border)] bg-[var(--pixel-yellow)] text-[var(--pixel-fg)]"
        : "border-[var(--pixel-border)] bg-[var(--pixel-yellow)] text-[var(--pixel-fg)]"
      : "border-transparent text-[var(--pixel-muted)] hover:border-[var(--pixel-border)] hover:bg-[#fffef8]",
  );
}

export type ResourceTypeId = "skill" | "rule" | "all";

/** 7.4.2 资源类型筛选（Skill / Rule / 全部），供榜单等页面复用 */
export function ResourceTypeFilter(props: {
  active: ResourceTypeId;
  links: Record<ResourceTypeId, string>;
  labels?: Partial<Record<ResourceTypeId, string>>;
}) {
  const { active, links } = props;
  const labels = {
    skill: "Skill",
    rule: "Rule",
    all: "双轨",
    ...props.labels,
  };
  const items: { id: ResourceTypeId; label: string }[] = [
    { id: "skill", label: labels.skill ?? "Skill" },
    { id: "rule", label: labels.rule ?? "Rule" },
    { id: "all", label: labels.all ?? "双轨" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="资源类型">
      <span className="text-xs text-[var(--pixel-muted)]">资源</span>
      {items.map(({ id, label }) => (
        <Link
          key={id}
          href={links[id]}
          title={id === "all" ? "同时展示 Skill 与 Rule" : undefined}
          className={chip(active === id, id === "rule")}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
