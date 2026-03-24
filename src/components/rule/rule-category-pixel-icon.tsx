import { cn } from "@/lib/utils";

/**
 * 5.2.2 / 3.2.1：Rule 分类 16×16 像素块（紫系），按 slug 区分纹样
 * 0 透明 1 浅 2 深
 */
const GLYPHS: Record<string, string[]> = {
  "rule-sets": ["00222200", "02222220", "02200220", "02200220", "02222220", "00222200", "00022000", "00000000"],
  "decision-tables": ["00000000", "02222220", "02022020", "02222220", "02022020", "02222220", "00000000", "00000000"],
  scorecards: ["00000000", "02222220", "02000020", "02222220", "02000020", "02222220", "00000000", "00000000"],
  "workflow-templates": ["00220000", "02222000", "02222000", "00222220", "00022222", "00002222", "00000220", "00000000"],
  "risk-control": ["00000000", "00222200", "02222220", "02222220", "00222200", "00022000", "00000000", "00000000"],
  "business-rules": ["02222220", "02200220", "02200220", "02222220", "02200220", "02200220", "02222220", "00000000"],
  "compliance-rules": ["02222220", "02000020", "02222220", "02000020", "02222220", "02000020", "02222220", "00000000"],
  "data-validation": ["00000000", "02222220", "02000020", "02222220", "02000020", "02222220", "00000000", "00000000"],
  "routing-rules": ["00000000", "00002200", "00022220", "00222200", "02220000", "22000000", "00000000", "00000000"],
  "transformation-rules": ["00000000", "02222220", "00222200", "00022220", "00222200", "02222220", "00000000", "00000000"],
};

const DEFAULT = GLYPHS["business-rules"]!;

export function RuleCategoryPixelIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const rows = GLYPHS[slug] ?? DEFAULT;
  const cell = 2;
  const pad = 0;
  const size = 16;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("h-7 w-7 shrink-0 overflow-visible", className)}
      aria-hidden
    >
      {rows.map((row, y) => (
        <g key={y}>
          {row.split("").map((ch, x) => {
            if (ch === "0") return null;
            const fill = ch === "2" ? "var(--rule-accent)" : "var(--rule-border)";
            return (
              <rect
                key={x}
                x={pad + x * cell}
                y={pad + y * cell}
                width={cell}
                height={cell}
                fill={fill}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
