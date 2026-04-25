/** 12.3 搜索结果关键词高亮 */
export function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) {
    return <>{text}</>;
  }
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${esc})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => {
        const hit = part.toLowerCase() === q.toLowerCase();
        return hit ? (
          <mark
            key={i}
            className="bg-[var(--pixel-yellow)] px-0.5 text-[var(--pixel-fg)] [box-decoration-break:clone]"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
