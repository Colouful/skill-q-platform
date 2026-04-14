export function stripLeadingFrontmatter(markdown: string | null | undefined): string {
  const content = markdown?.trimStart() ?? "";
  if (!content.startsWith("---")) return markdown?.trim() ?? "";

  const normalized = content.replace(/\r\n/g, "\n");
  const closingIndex = normalized.indexOf("\n---", 3);
  if (closingIndex === -1) return markdown?.trim() ?? "";

  return normalized.slice(closingIndex + 4).trim();
}
