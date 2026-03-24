import { LobsterClawIcon } from "@/components/lobster";

/** 10.1 只读星级（1–5 钳） */
export function LobsterRatingDisplay({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const r = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`} title={`${r}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <LobsterClawIcon key={i} filled={i < r} className="h-4 w-4 sm:h-5 sm:w-5" />
      ))}
    </span>
  );
}
