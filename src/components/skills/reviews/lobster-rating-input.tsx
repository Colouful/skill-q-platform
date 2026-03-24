"use client";

import { LobsterClawIcon } from "@/components/lobster";

/** 10.1 可点击选择 1–5 分 */
export function LobsterRatingInput({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  id?: string;
}) {
  return (
    <div id={id} className="flex items-center gap-1" role="group" aria-label="评分 1 到 5">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded border-2 border-transparent p-0.5 transition hover:border-[var(--pixel-border)]"
            aria-pressed={active}
            aria-label={`${n} 分`}
          >
            <LobsterClawIcon filled={active} className="h-7 w-7 sm:h-8 sm:w-8" />
          </button>
        );
      })}
    </div>
  );
}
