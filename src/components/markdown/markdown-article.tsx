import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownArticle({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-[family-name:var(--font-pixel-body)] text-sm leading-7 text-[var(--pixel-muted)]",
        "[&_a]:text-[var(--pixel-accent)] [&_a]:underline [&_a]:underline-offset-2",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-[var(--pixel-border)] [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_code]:rounded [&_code]:bg-[var(--pixel-cyan)]/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-[var(--pixel-fg)]",
        "[&_h1]:font-[family-name:var(--font-pixel-heading)] [&_h1]:text-lg [&_h1]:text-[var(--pixel-fg)]",
        "[&_h2]:mt-8 [&_h2]:font-[family-name:var(--font-pixel-heading)] [&_h2]:text-base [&_h2]:text-[var(--pixel-fg)]",
        "[&_h3]:mt-6 [&_h3]:font-[family-name:var(--font-pixel-heading)] [&_h3]:text-sm [&_h3]:text-[var(--pixel-fg)]",
        "[&_hr]:my-6 [&_hr]:border-[var(--pixel-border)]",
        "[&_li]:mb-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_p]:my-3",
        "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:border-2 [&_pre]:border-[var(--pixel-border)] [&_pre]:bg-[#f7f0e0] [&_pre]:p-3",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto border-2 border-[var(--pixel-border)]">
                <table className="min-w-full border-collapse bg-[#fffef8] text-left text-xs text-[var(--pixel-fg)]">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-[var(--pixel-border)] bg-[var(--pixel-yellow)]/30 px-3 py-2 font-[family-name:var(--font-pixel-heading)] text-[var(--pixel-fg)]">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-[var(--pixel-border)] px-3 py-2 align-top text-[var(--pixel-muted)]">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
