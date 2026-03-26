/**
 * 取正文第一段：按空行（含仅含空白行的段落分隔）切分，返回第一个非空块。
 * 全文无空行时返回 trim 后的整段文本。
 */
export function takeFirstParagraph(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const blocks = t.split(/\r?\n\s*\r?\n/);
  for (const block of blocks) {
    const s = block.trim();
    if (s.length > 0) return s;
  }
  return t;
}

/** ATX 风格：`#`～`######` 后接标题文字（CommonMark：行首至多 3 空格） */
const ATX_HEADING = /^\s{0,3}(#{1,6})(\s+.+?)\s*$/;

function isAtxHeadingLine(line: string): boolean {
  return ATX_HEADING.test(line);
}

/**
 * 取「第一个 Markdown 标题 + 该标题下的第一段」。
 * 标题下第一段在遇到空行（段落结束）或下一个 `#` 标题时结束。
 * 若正文开头没有 ATX 标题，则退回 {@link takeFirstParagraph}。
 */
export function takeHeadingAndFirstParagraph(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return "";

  if (!isAtxHeadingLine(lines[i])) {
    return takeFirstParagraph(normalized.trim());
  }

  const headingLine = lines[i].trimEnd();
  i++;
  while (i < lines.length && lines[i].trim() === "") i++;

  const paraLines: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    if (isAtxHeadingLine(line)) break;
    if (line.trim() === "") {
      if (paraLines.length > 0) break;
      i++;
      continue;
    }
    paraLines.push(line);
    i++;
  }

  const para = paraLines.join("\n").trim();
  if (!para) return headingLine;
  return `${headingLine}\n\n${para}`;
}
