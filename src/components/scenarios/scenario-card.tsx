import Link from "next/link";
import { pixelCardVariants } from "@/components/pixel";
import { Badge } from "@/components/ui/badge";
import { ClampedCardDescription } from "@/components/card/clamped-card-description";
import { stringArrayFromJson } from "@/lib/catalog";
import { scenarioPath } from "@/lib/slug-url";
import { cn } from "@/lib/utils";

type ScenarioCardItem = {
  slug: string;
  name: string;
  description: string;
  isFeatured: boolean;
  supportedProfiles: unknown;
  recommendedIdes: unknown;
  entryRole: { name: string } | null;
  roles: { id: string }[];
  skills: { id: string }[];
  rules: { id: string }[];
};

export function ScenarioCard({ scenario }: { scenario: ScenarioCardItem }) {
  const profiles = stringArrayFromJson(scenario.supportedProfiles);
  const ides = stringArrayFromJson(scenario.recommendedIdes);

  return (
    <Link
      href={scenarioPath(scenario.slug)}
      className={cn(pixelCardVariants(), "group/card flex h-full flex-col gap-3")}
    >
      <div className="space-y-1">
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
          场景方案
          {scenario.isFeatured ? " · 推荐" : ""}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          {scenario.name}
        </h3>
      </div>

      <ClampedCardDescription>{scenario.description}</ClampedCardDescription>

      <div className="flex flex-wrap gap-2">
        {profiles.slice(0, 2).map((profile) => (
          <Badge key={profile} variant="secondary" className="bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]">
            {profile}
          </Badge>
        ))}
        {ides.slice(0, 2).map((ide) => (
          <Badge key={ide} variant="outline" className="border-[var(--pixel-border)] bg-transparent">
            {ide}
          </Badge>
        ))}
      </div>

      <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        入口专家：{scenario.entryRole?.name ?? "未设置"}
      </p>
      <p className="mt-auto font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        专家 {scenario.roles.length} · Skill {scenario.skills.length} · Rule {scenario.rules.length}
      </p>
    </Link>
  );
}
