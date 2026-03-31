import Link from "next/link";
import { pixelCardVariants } from "@/components/pixel";
import { Badge } from "@/components/ui/badge";
import { ClampedCardDescription } from "@/components/card/clamped-card-description";
import { stringArrayFromJson } from "@/lib/catalog";
import { rolePath } from "@/lib/slug-url";
import { cn } from "@/lib/utils";

type RoleCardItem = {
  slug: string;
  name: string;
  description: string;
  author: string;
  supportedProfiles: unknown;
  domainLinks: { domain: { id: string; name: string } }[];
  skillLinks: { id: string }[];
  ruleLinks: { id: string }[];
};

export function RoleCard({ role }: { role: RoleCardItem }) {
  const profiles = stringArrayFromJson(role.supportedProfiles);
  const domains = role.domainLinks.map((item) => item.domain.name).slice(0, 3);

  return (
    <Link
      href={rolePath(role.slug)}
      className={cn(pixelCardVariants(), "group/card flex h-full flex-col gap-3")}
    >
      <div className="space-y-1">
        <p className="font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-accent)]">
          专家 · {role.author}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] font-[family-name:var(--font-pixel-heading)] text-sm text-[var(--pixel-fg)]">
          {role.name}
        </h3>
      </div>

      <ClampedCardDescription>{role.description}</ClampedCardDescription>

      <div className="flex flex-wrap gap-2">
        {domains.map((domain) => (
          <Badge key={domain} variant="outline" className="border-[var(--pixel-border)] bg-transparent">
            {domain}
          </Badge>
        ))}
        {profiles.slice(0, 2).map((profile) => (
          <Badge key={profile} variant="secondary" className="bg-[var(--pixel-cyan)]/15 text-[var(--pixel-fg)]">
            {profile}
          </Badge>
        ))}
      </div>

      <p className="mt-auto font-[family-name:var(--font-pixel-body)] text-xs text-[var(--pixel-muted)]">
        Skill {role.skillLinks.length} · Rule {role.ruleLinks.length}
      </p>
    </Link>
  );
}
