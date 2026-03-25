import Link from "next/link";
import { skillPath } from "@/lib/slug-url";
import type { Version } from "@/generated/prisma";

/** 8.1 版本列表（像素块 + 链到详情） */
export function SkillVersionsList({
  slug,
  versions,
}: {
  slug: string;
  versions: Version[];
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
          className="flex items-center justify-between gap-3 border-2 border-[var(--pixel-border)] bg-[#fffef8] px-3 py-2"
        >
          <Link
            href={skillPath(slug, `/versions/${encodeURIComponent(v.version)}`)}
            className="text-[var(--pixel-fg)] underline decoration-[var(--pixel-border)] decoration-2 underline-offset-2 hover:text-[var(--pixel-accent)]"
          >
            {v.version}
          </Link>
          <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--pixel-muted)]">
            <span title="本版本下载">⬇ {v.downloads}</span>
            {v.isLatest && (
              <span className="border border-[var(--pixel-accent)] px-1 text-[var(--pixel-accent)]">
                latest
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
