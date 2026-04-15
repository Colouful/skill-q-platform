import Link from "next/link";
import type { RuleVersion } from "@/generated/prisma";
import { rulePath } from "@/lib/slug-url";
import { RuleVersionDownloadButton } from "./rule-version-download-button";

export function RuleVersionsList({
  slug,
  versions,
}: {
  slug: string;
  versions: RuleVersion[];
}) {
  if (versions.length === 0) {
    return (
      <p className="mt-2 font-[family-name:var(--font-pixel-body)] text-sm text-[var(--pixel-muted)]">
        暂无版本
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-2 font-[family-name:var(--font-pixel-body)] text-sm">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--rule-border)] bg-[#fffef8] px-3 py-2"
        >
          <div className="min-w-0">
            <Link
              href={rulePath(slug, `/versions/${encodeURIComponent(v.version)}`)}
              className="font-medium text-[var(--pixel-fg)] underline decoration-[var(--rule-border)] decoration-2 underline-offset-2 hover:text-[var(--rule-accent)]"
            >
              {v.version}
            </Link>
            {v.isLatest && (
              <span className="ml-2 border border-[var(--rule-border)] px-1 text-xs text-[var(--rule-accent)]">
                latest
              </span>
            )}
          </div>
          <RuleVersionDownloadButton
            slug={slug}
            versionLabel={v.version}
            initialVersionDownloads={v.downloads}
            compact
          />
        </li>
      ))}
    </ul>
  );
}
