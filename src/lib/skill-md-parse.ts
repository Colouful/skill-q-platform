/** 13.4 解析 SKILL.md 的 YAML 风格 frontmatter（简单 key: value，不依赖 yaml 包） */
export function parseSkillMd(content: string): {
  meta: Record<string, string>;
  body: string;
} {
  const t = content.trimStart();
  if (!t.startsWith("---")) {
    return { meta: {}, body: content };
  }
  const end = t.indexOf("\n---", 3);
  if (end === -1) {
    return { meta: {}, body: content };
  }
  const front = t.slice(3, end).trim();
  const body = t.slice(end + 4).trimStart();
  const meta: Record<string, string> = {};
  for (const line of front.split("\n")) {
    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    meta[m[1].toLowerCase()] = v;
  }
  return { meta, body };
}

/** 从 meta 中取展示用名称、描述 */
export function metaToSkillHints(meta: Record<string, string>): {
  name?: string;
  description?: string;
} {
  const name =
    meta.name || meta.title || meta["display-name"] || meta.skill;
  const description = meta.description || meta.summary || meta.desc;
  return {
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
  };
}

/** RULE.md 与 SKILL.md 同构 frontmatter，名称字段可写 rule */
export function metaToRuleHints(meta: Record<string, string>): {
  name?: string;
  description?: string;
} {
  const name =
    meta.name || meta.title || meta["display-name"] || meta.rule;
  const description = meta.description || meta.summary || meta.desc;
  return {
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
  };
}
