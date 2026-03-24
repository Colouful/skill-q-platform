"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useSyncExternalStore } from "react";
import type { Category, Skill } from "@/generated/prisma";
import { SkillCard } from "@/components/skill/skill-card";

type SkillRow = Skill & { category: Category };

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function colsFromWidth(w: number): number {
  if (w >= 1280) return 4;
  if (w >= 1024) return 3;
  if (w >= 640) return 2;
  return 1;
}

/** 与 Tailwind sm:2 / lg:3 / xl:4 对齐；服务端快照 2 列减少首屏与客户端偏差 */
function useColumnCount(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("resize", onStoreChange);
      return () => window.removeEventListener("resize", onStoreChange);
    },
    () => colsFromWidth(window.innerWidth),
    () => 2,
  );
}

const ROW_GAP_PX = 16;
/** 18.4 榜单长列表：按行虚拟化，减少首屏 DOM */
export function VirtualizedDiscoverSkillGrid({ skills }: { skills: SkillRow[] }) {
  const cols = useColumnCount();
  const rows = useMemo(() => chunk(skills, cols), [skills, cols]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 200,
    overscan: 3,
    gap: ROW_GAP_PX,
  });

  return (
    <div
      className="w-full"
      style={{
        height: virtualizer.getTotalSize(),
        position: "relative",
      }}
    >
      {virtualizer.getVirtualItems().map((vi) => {
        const row = rows[vi.index];
        if (!row) return null;
        return (
          <div
            key={vi.key}
            data-index={vi.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{ transform: `translateY(${vi.start}px)` }}
          >
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {row.map((s) => (
                <div key={s.id} className="skill-card-cv min-w-0">
                  <SkillCard skill={s} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
