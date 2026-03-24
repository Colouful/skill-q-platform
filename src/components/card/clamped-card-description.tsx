/**
 * 列表卡片描述：固定两行省略。
 */
export function ClampedCardDescription({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mt-2 min-h-[2.75rem] flex-1">
      <p className="line-clamp-2 break-words font-[family-name:var(--font-pixel-body)] text-sm leading-snug text-[var(--pixel-muted)]">
        {children}
      </p>
    </div>
  );
}
